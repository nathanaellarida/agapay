"""Build Agapay's local JSON vector index from reviewed text documents."""

from __future__ import annotations

import json
import os
from pathlib import Path

from rag_chain import (
    EMBEDDING_MODEL,
    EMBEDDING_MODEL_REVISION,
    INDEX_PATH,
    INDEX_SCHEMA_VERSION,
    get_embedding_model,
    require_backend_path,
    resolve_configured_path,
)

DATA_DIR = require_backend_path(
    resolve_configured_path("DATA_DIR", "./data"), "DATA_DIR"
)
CHUNK_SIZE = 800
CHUNK_OVERLAP = 120


def load_documents() -> list[tuple[str, str]]:
    if not DATA_DIR.is_dir():
        raise FileNotFoundError(f"Data directory is missing or invalid: {DATA_DIR}")

    txt_files = sorted(
        (
            path
            for path in DATA_DIR.iterdir()
            if path.is_file() and path.suffix.lower() == ".txt"
        ),
        key=lambda path: path.name.casefold(),
    )
    if not txt_files:
        raise FileNotFoundError(f"No .txt files found in {DATA_DIR}")

    documents = []
    for path in txt_files:
        if path.is_symlink():
            raise ValueError(f"Refusing to ingest symbolic link: {path.name}")
        content = path.read_text(encoding="utf-8")
        if not content.strip():
            raise ValueError(f"Document is empty: {path.name}")
        documents.append((path.name, content))
        print(f"  loaded {path.name}")
    return documents


def split_text(text: str) -> list[str]:
    """Split text deterministically while preferring natural boundaries."""
    normalized = text.replace("\r\n", "\n").strip()
    chunks: list[str] = []
    start = 0

    while start < len(normalized):
        end = min(start + CHUNK_SIZE, len(normalized))
        if end < len(normalized):
            boundaries = (
                normalized.rfind("\n\n", start, end),
                normalized.rfind("\n", start, end),
                normalized.rfind(". ", start, end),
            )
            boundary = max(boundaries)
            if boundary > start + CHUNK_SIZE // 2:
                end = boundary + (2 if normalized[boundary : boundary + 2] == ". " else 0)

        chunk = normalized[start:end].strip()
        if chunk:
            chunks.append(chunk)
        if end >= len(normalized):
            break
        start = max(end - CHUNK_OVERLAP, start + 1)

    return chunks


def build_entries(documents: list[tuple[str, str]]) -> list[dict]:
    chunks = [
        {"source": source, "text": chunk}
        for source, text in documents
        for chunk in split_text(text)
    ]
    if not chunks:
        raise ValueError("No content was available to index")

    embeddings = get_embedding_model().encode(
        [chunk["text"] for chunk in chunks],
        batch_size=32,
        normalize_embeddings=True,
        convert_to_numpy=True,
        show_progress_bar=True,
    )
    return [
        {**chunk, "embedding": embedding.tolist()}
        for chunk, embedding in zip(chunks, embeddings, strict=True)
    ]


def write_index(entries: list[dict]) -> None:
    if INDEX_PATH.suffix.lower() != ".json":
        raise ValueError("INDEX_PATH must use a .json extension")

    payload = {
        "schema_version": INDEX_SCHEMA_VERSION,
        "model": {
            "name": EMBEDDING_MODEL,
            "revision": EMBEDDING_MODEL_REVISION,
        },
        "entries": entries,
    }
    temporary_path = INDEX_PATH.with_suffix(".json.tmp")
    temporary_path.write_text(
        json.dumps(payload, ensure_ascii=False, allow_nan=False, separators=(",", ":")),
        encoding="utf-8",
    )
    os.replace(temporary_path, INDEX_PATH)


def main() -> None:
    print(f"Data dir:  {DATA_DIR}")
    print(f"Index:     {INDEX_PATH}")
    print()
    documents = load_documents()
    entries = build_entries(documents)
    write_index(entries)
    print(f"\nDone. Indexed {len(entries)} chunks.")


if __name__ == "__main__":
    main()
