"""
main.py — FastAPI entrypoint.

Endpoints:
    POST /query     -> run the RAG chain (accepts persona)
    GET  /personas  -> list available personas
    GET  /library   -> list source documents currently indexed
    GET  /health    -> liveness probe
"""

from __future__ import annotations

import logging
import os
import unicodedata
from datetime import datetime, timezone
from pathlib import Path
from typing import Literal
from urllib.parse import urlsplit

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict, Field, field_validator
from starlette.responses import JSONResponse

from rag_chain import (
    answer_question,
    get_index_state,
    is_source_current,
    list_personas,
    require_backend_path,
    resolve_configured_path,
    validate_source_name,
)

logger = logging.getLogger(__name__)
RETRY_AFTER_SECONDS = 5
MAX_QUERY_BODY_BYTES = 64 * 1024


def parse_cors_origins(value: str) -> list[str]:
    """Return unique HTTP(S) origins and reject malformed configuration."""
    origins: list[str] = []
    for configured in value.split(","):
        origin = configured.strip().removesuffix("/")
        if not origin:
            continue
        try:
            parsed = urlsplit(origin)
            parsed.port
        except ValueError:
            raise ValueError("CORS_ORIGINS contains an invalid origin") from None
        if (
            origin == "*"
            or parsed.scheme not in {"http", "https"}
            or not parsed.hostname
            or parsed.username is not None
            or parsed.password is not None
            or parsed.path
            or parsed.query
            or parsed.fragment
            or any(character.isspace() for character in origin)
        ):
            raise ValueError("CORS_ORIGINS contains an invalid origin")
        if origin not in origins:
            origins.append(origin)

    if not origins:
        raise ValueError("CORS_ORIGINS must list explicit trusted origins")
    return origins

DATA_DIR = require_backend_path(
    resolve_configured_path("DATA_DIR", "./data"), "DATA_DIR"
)
CORS_ORIGINS = parse_cors_origins(
    os.getenv(
        "CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
    )
)

app = FastAPI(
    title="Agapay — Entrepreneurial Launchpad",
    version="2.0.0",
    description="Persona-aware RAG API for Filipino founders.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


@app.middleware("http")
async def limit_query_request_body(request: Request, call_next):
    """Reject oversized query payloads before JSON parsing or model work."""
    if request.method == "POST" and request.url.path == "/query":
        content_length = request.headers.get("content-length")
        if content_length and content_length.isdecimal():
            if int(content_length) > MAX_QUERY_BODY_BYTES:
                return JSONResponse(
                    status_code=413,
                    content={"detail": "Query request body is too large."},
                )

        body = bytearray()
        async for chunk in request.stream():
            if len(body) + len(chunk) > MAX_QUERY_BODY_BYTES:
                return JSONResponse(
                    status_code=413,
                    content={"detail": "Query request body is too large."},
                )
            body.extend(chunk)
        request._body = bytes(body)

    return await call_next(request)


@app.middleware("http")
async def security_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "no-referrer"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    response.headers["Cache-Control"] = "no-store"
    return response


# --------------------------------------------------------------------------- #
# Schemas
# --------------------------------------------------------------------------- #
class QueryRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    question: str = Field(..., min_length=2, max_length=2000)
    persona: Literal["tech", "online", "local"] = "tech"

    @field_validator("question", mode="before")
    @classmethod
    def normalize_question(cls, value: object) -> object:
        if not isinstance(value, str):
            return value
        normalized = value.strip()
        if any(
            unicodedata.category(character) == "Cc"
            and character not in "\t\n\r"
            for character in normalized
        ):
            raise ValueError("Question cannot contain control characters")
        visible_characters = sum(
            character.isprintable() and not character.isspace()
            for character in normalized
        )
        if visible_characters < 2:
            raise ValueError("Question must contain at least two visible characters")
        return normalized


class SourceCitation(BaseModel):
    source: str
    snippet: str


class QueryResponse(BaseModel):
    answer: str
    persona: str
    sources: list[SourceCitation]


class Persona(BaseModel):
    key: str
    name: str
    title: str


class LibraryDocument(BaseModel):
    filename: str
    title: str
    category: str          # "Tech" | "Online" | "Local" | "General"
    last_updated: str
    status: str


# --------------------------------------------------------------------------- #
# Helpers
# --------------------------------------------------------------------------- #
def classify_category(filename: str) -> str:
    n = filename.upper()
    if any(k in n for k in ("STARTUP_ACT", "DOST", "INNOVATIVE")):
        return "Tech"
    if any(k in n for k in ("MARKETPLACE", "TIKTOK", "SHOPEE", "LAZADA", "ONLINE")):
        return "Online"
    if any(k in n for k in ("LGU", "MAYOR", "CEBU", "LAPU", "BARANGAY", "LOCAL")):
        return "Local"
    return "General"


def prettify_title(filename: str) -> str:
    stem = Path(filename).stem.replace("_", " ").replace("-", " ")
    return " ".join(stem.split())


def format_last_updated(timestamp: float) -> str:
    """Return an ISO date without letting invalid metadata break the library."""
    try:
        return datetime.fromtimestamp(timestamp, tz=timezone.utc).date().isoformat()
    except (OSError, OverflowError, ValueError):
        return "Unknown"


# --------------------------------------------------------------------------- #
# Routes
# --------------------------------------------------------------------------- #
@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "agapay"}


@app.get("/personas", response_model=list[Persona])
def personas() -> list[Persona]:
    return [Persona(**p) for p in list_personas()]


@app.post("/query", response_model=QueryResponse)
def query(body: QueryRequest) -> QueryResponse:
    try:
        result = answer_question(body.question, persona=body.persona)
    except Exception as exc:  # noqa: BLE001
        logger.error("RAG query failed (%s)", type(exc).__name__)
        raise HTTPException(
            status_code=503,
            detail="The assistant is temporarily unavailable.",
            headers={"Retry-After": str(RETRY_AFTER_SECONDS)},
        ) from exc
    return QueryResponse(**result)


@app.get("/library", response_model=list[LibraryDocument])
def library() -> list[LibraryDocument]:
    if not DATA_DIR.is_dir():
        return []

    try:
        index_state = get_index_state()
    except (OSError, UnicodeError, ValueError) as exc:
        logger.warning("Could not read vector index (%s)", type(exc).__name__)
        index_state = (frozenset(), -1)

    items: list[LibraryDocument] = []
    try:
        text_paths = sorted(
            (
                path
                for path in DATA_DIR.iterdir()
                if (
                    path.is_file()
                    and not path.is_symlink()
                    and path.suffix.lower() == ".txt"
                )
            ),
            key=lambda path: path.name.casefold(),
        )
    except OSError as exc:
        logger.warning("Could not list library documents (%s)", type(exc).__name__)
        return []

    for path in text_paths:
        try:
            validate_source_name(path.name)
        except ValueError:
            logger.warning(
                "Skipping library document with invalid filename %r",
                path.name,
            )
            continue
        try:
            stat = path.stat()
        except OSError as exc:
            logger.warning(
                "Could not inspect library document %s (%s)",
                path.name,
                type(exc).__name__,
            )
            continue
        items.append(
            LibraryDocument(
                filename=path.name,
                title=prettify_title(path.name),
                category=classify_category(path.name),
                last_updated=format_last_updated(stat.st_mtime),
                status=(
                    "Indexed & Active"
                    if is_source_current(path.name, stat.st_mtime_ns, index_state)
                    else "Needs Reindex"
                ),
            )
        )
    return items
