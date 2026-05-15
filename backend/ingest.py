"""
ingest.py
---------
One-off script: load every .txt file in DATA_DIR, split it, embed it, and
persist into ChromaDB. Safe to re-run — the collection is recreated each time.

Run:  python ingest.py
"""

from __future__ import annotations

import os
import shutil
from pathlib import Path

from dotenv import load_dotenv
from langchain_chroma import Chroma
from langchain_community.document_loaders import TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter

from rag_chain import build_embeddings

load_dotenv(dotenv_path=Path(__file__).parent / ".env.local")

DATA_DIR = Path(os.getenv("DATA_DIR", "./data"))
CHROMA_DIR = Path(os.getenv("CHROMA_DIR", "./chroma_db"))
COLLECTION_NAME = os.getenv("COLLECTION_NAME", "agapay_msme")


def load_documents() -> list:
    if not DATA_DIR.exists():
        raise FileNotFoundError(f"Data directory not found: {DATA_DIR.resolve()}")

    txt_files = sorted(DATA_DIR.glob("*.txt"))
    if not txt_files:
        raise FileNotFoundError(f"No .txt files found in {DATA_DIR.resolve()}")

    docs = []
    for path in txt_files:
        loader = TextLoader(str(path), encoding="utf-8")
        for d in loader.load():
            # Normalize the metadata source to the plain filename — the UI
            # surfaces this value as the citation.
            d.metadata["source"] = path.name
            docs.append(d)
        print(f"  loaded {path.name}")
    return docs


def main() -> None:
    print(f"Data dir:     {DATA_DIR.resolve()}")
    print(f"Chroma dir:   {CHROMA_DIR.resolve()}")
    print(f"Collection:   {COLLECTION_NAME}")
    print()

    # Wipe old index so re-ingestion is deterministic.
    if CHROMA_DIR.exists():
        print("Removing existing Chroma index…")
        shutil.rmtree(CHROMA_DIR, ignore_errors=True)

    print("Loading documents…")
    raw_docs = load_documents()

    print(f"Splitting {len(raw_docs)} documents…")
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=800,
        chunk_overlap=120,
        separators=["\n\n", "\n", ". ", " ", ""],
    )
    chunks = splitter.split_documents(raw_docs)
    print(f"  produced {len(chunks)} chunks")

    print("Embedding + persisting to ChromaDB…")
    Chroma.from_documents(
        documents=chunks,
        embedding=build_embeddings(),
        collection_name=COLLECTION_NAME,
        persist_directory=str(CHROMA_DIR),
    )

    print("\nDone. Index built successfully.")


if __name__ == "__main__":
    main()
