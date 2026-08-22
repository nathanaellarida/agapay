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
from datetime import datetime
from pathlib import Path
from typing import Literal

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator

from rag_chain import (
    answer_question,
    list_personas,
    require_backend_path,
    resolve_configured_path,
)

logger = logging.getLogger(__name__)

DATA_DIR = require_backend_path(
    resolve_configured_path("DATA_DIR", "./data"), "DATA_DIR"
)
CORS_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
    ).split(",")
    if origin.strip()
]
if not CORS_ORIGINS or "*" in CORS_ORIGINS:
    raise ValueError("CORS_ORIGINS must list explicit trusted origins")

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
    question: str = Field(..., min_length=2, max_length=2000)
    persona: Literal["tech", "online", "local"] = "tech"

    @field_validator("question")
    @classmethod
    def normalize_question(cls, value: str) -> str:
        normalized = value.strip()
        if len(normalized) < 2:
            raise ValueError("Question must contain at least two non-whitespace characters")
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
    status: str = "Indexed & Active"


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
        ) from exc
    return QueryResponse(**result)


@app.get("/library", response_model=list[LibraryDocument])
def library() -> list[LibraryDocument]:
    if not DATA_DIR.exists():
        return []

    items: list[LibraryDocument] = []
    text_paths = (
        path
        for path in DATA_DIR.iterdir()
        if path.is_file() and path.suffix.lower() == ".txt"
    )
    for path in sorted(text_paths):
        stat = path.stat()
        items.append(
            LibraryDocument(
                filename=path.name,
                title=prettify_title(path.name),
                category=classify_category(path.name),
                last_updated=datetime.fromtimestamp(stat.st_mtime).date().isoformat(),
            )
        )
    return items
