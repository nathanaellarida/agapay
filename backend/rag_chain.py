"""
rag_chain.py
------------
Persona-aware RAG pipeline for Agapay.

LLM:        Groq  (llama-3.3-70b-versatile)
Embeddings: sentence-transformers/all-MiniLM-L6-v2 (local, no API key)

Three personas — each has its own system prompt:
    tech    -> Anton, the Tech Strategist
    online  -> Luz,   the E-Commerce Pro
    local   -> Miko,  the Local Builder
"""

from __future__ import annotations

import os
from functools import lru_cache
from typing import Any

from dotenv import load_dotenv
from langchain.chains import RetrievalQA
from langchain_chroma import Chroma
from langchain_core.prompts import PromptTemplate

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env.local"))

CHROMA_DIR = os.getenv("CHROMA_DIR", "./chroma_db")
COLLECTION_NAME = os.getenv("COLLECTION_NAME", "agapay_msme")

FALLBACK_ANSWER = "I don't have that specific guidance in my knowledge base yet, but here's what I can share generally: try checking the official agency portal or asking a follow-up question I can ground in my documents."


# --------------------------------------------------------------------------- #
# Personas
# --------------------------------------------------------------------------- #
PERSONAS = {
    "tech": {
        "name": "Anton",
        "title": "The Tech Strategist",
        "voice": (
            "You are Anton, a seasoned tech startup mentor in the Philippines. "
            "You speak like a friendly but sharp founder-mentor. "
            "Your strengths are the Innovative Startup Act (RA 11337), DOST grants, "
            "MVP development, and helping founders think about scalability and traction. "
            "You're encouraging but honest — you'll point out when an idea needs more "
            "validation. You frame answers around growth, fundability, and product-market fit."
        ),
    },
    "online": {
        "name": "Luz",
        "title": "The E-Commerce Pro",
        "voice": (
            "You are Luz, a digital-first marketplace pro who has helped Filipino "
            "online sellers scale on TikTok Shop, Shopee, and Lazada. "
            "You sound like a savvy digital marketer — practical, conversion-focused, "
            "and quick to spot platform-specific opportunities. "
            "Your specialty is online business registration, marketplace policies, "
            "platform-specific seller programs, and content/marketing tactics. "
            "You give actionable, step-by-step advice with platform names and exact actions."
        ),
    },
    "local": {
        "name": "Miko",
        "title": "The Local Builder",
        "voice": (
            "You are Miko, a hands-on community business mentor based in Cebu. "
            "You sound like a kuya/ate who has actually opened cafes, sari-sari stores, "
            "and service shops in Metro Cebu and Lapu-Lapu. "
            "Your specialty is the practical reality of opening a physical business: "
            "permits, location scouting, fit-out costs, and the LGU process. "
            "You speak warmly and use concrete numbers and real-world tips."
        ),
    },
}

DEFAULT_PERSONA = "tech"


def _build_prompt(persona_key: str) -> PromptTemplate:
    persona = PERSONAS.get(persona_key, PERSONAS[DEFAULT_PERSONA])

    template = f"""{persona['voice']}

You are answering a question for a Filipino entrepreneur. Use ONLY the context
below. Rules:
- If the context does not contain the answer, say so honestly in your own
  voice and suggest where they could look next. Do not invent specific fees,
  deadlines, form numbers, or office names.
- Prefer concise, numbered or bulleted steps for procedures.
- Be encouraging and accessible. Avoid jargon unless you explain it.
- Stay in character as {persona['name']}.

Context:
{{context}}

Question: {{question}}

Answer (as {persona['name']}):"""

    return PromptTemplate(
        template=template,
        input_variables=["context", "question"],
    )


# --------------------------------------------------------------------------- #
# Provider factories
# --------------------------------------------------------------------------- #
def build_embeddings():
    """Local sentence-transformers embeddings — no API key required."""
    from langchain_huggingface import HuggingFaceEmbeddings

    return HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-MiniLM-L6-v2",
        model_kwargs={"device": "cpu"},
        encode_kwargs={"normalize_embeddings": True},
    )


def build_llm():
    """Groq-hosted LLaMA 3.3 70B."""
    from langchain_groq import ChatGroq

    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        raise ValueError("GROQ_API_KEY is not set in .env.local")

    return ChatGroq(
        model="llama-3.3-70b-versatile",
        temperature=0.2,
        groq_api_key=api_key,
    )


# --------------------------------------------------------------------------- #
# Chain assembly (cached)
# --------------------------------------------------------------------------- #
@lru_cache(maxsize=1)
def get_vectorstore() -> Chroma:
    return Chroma(
        collection_name=COLLECTION_NAME,
        embedding_function=build_embeddings(),
        persist_directory=CHROMA_DIR,
    )


@lru_cache(maxsize=8)
def get_qa_chain(persona_key: str) -> RetrievalQA:
    """One chain per persona, cached so we don't rebuild on every request."""
    vectorstore = get_vectorstore()
    retriever = vectorstore.as_retriever(search_kwargs={"k": 4})

    return RetrievalQA.from_chain_type(
        llm=build_llm(),
        chain_type="stuff",
        retriever=retriever,
        return_source_documents=True,
        chain_type_kwargs={"prompt": _build_prompt(persona_key)},
    )


# --------------------------------------------------------------------------- #
# Public API
# --------------------------------------------------------------------------- #
def answer_question(question: str, persona: str = DEFAULT_PERSONA) -> dict[str, Any]:
    """
    Run the RAG chain for a given persona. Returns:
        {
          "answer":  str,
          "persona": "tech" | "online" | "local",
          "sources": [ { "source": "filename.txt", "snippet": "..." }, ... ]
        }
    """
    persona_key = persona if persona in PERSONAS else DEFAULT_PERSONA
    chain = get_qa_chain(persona_key)
    result = chain.invoke({"query": question})

    answer = (result.get("result") or "").strip() or FALLBACK_ANSWER

    seen: set[str] = set()
    sources: list[dict[str, str]] = []
    for doc in result.get("source_documents", []) or []:
        src = os.path.basename(doc.metadata.get("source", "unknown.txt"))
        if src in seen:
            continue
        seen.add(src)
        snippet = (doc.page_content or "").strip().replace("\n", " ")
        if len(snippet) > 240:
            snippet = snippet[:240] + "…"
        sources.append({"source": src, "snippet": snippet})

    return {"answer": answer, "persona": persona_key, "sources": sources}


def list_personas() -> list[dict]:
    return [
        {"key": key, "name": p["name"], "title": p["title"]}
        for key, p in PERSONAS.items()
    ]
