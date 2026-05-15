# Agapay — MSME Regulatory & Compliance Navigator

> AI-powered regulatory assistant for Filipino micro, small, and medium enterprises.
> Retrieval-Augmented Generation (RAG) over DTI, BIR, and LGU (Cebu / Lapu-Lapu) documents.

Styled to match the eGovPH / "Bagong Pilipinas" super-app aesthetic.

---

## Tech Stack

| Layer            | Tech                                              |
|------------------|---------------------------------------------------|
| Frontend         | React (Vite) + Tailwind CSS + React Router       |
| Backend          | FastAPI (Python 3.10+)                            |
| RAG orchestration| LangChain                                         |
| Vector store     | ChromaDB (persistent, local)                      |
| Embeddings / LLM | Google Gemini (default) or OpenAI (swap-in)       |

---

## Project Structure

```
Agapay/
├── backend/
│   ├── main.py              # FastAPI app + /query, /library endpoints
│   ├── rag_chain.py         # LangChain RetrievalQA pipeline
│   ├── ingest.py            # One-off script to build the ChromaDB index
│   ├── requirements.txt
│   ├── .env.example
│   └── data/                # Source documents (.txt) — the "knowledge base"
└── frontend/
    ├── index.html
    ├── package.json
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── vite.config.js
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── index.css
        ├── components/
        │   ├── Navbar.jsx
        │   ├── ChatMessage.jsx
        │   ├── SourceCitation.jsx
        │   └── Loader.jsx
        └── pages/
            ├── Home.jsx
            ├── Chat.jsx
            └── Library.jsx
```

---

## Backend Setup

```bat
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
:: Open .env and add your GOOGLE_API_KEY (or OPENAI_API_KEY)

:: Build the vector index from /data
python ingest.py

:: Run the API
uvicorn main:app --reload --port 8000
```

API runs on `http://localhost:8000`.

- `POST /query`  — body: `{ "question": "..." }` → `{ "answer": "...", "sources": [...] }`
- `GET  /library` — lists every indexed document (fuels the Library page)

---

## Frontend Setup

```bat
cd frontend
npm install
npm run dev
```

Vite serves on `http://localhost:5173` and proxies `/api` to FastAPI.

---

## Swapping the LLM

Open `backend/rag_chain.py` — the `build_llm()` and `build_embeddings()` helpers are the only places you need to touch. Google Gemini is the default; an OpenAI branch is included and commented.

---

## Adding more documents

Drop any `.txt` file into `backend/data/` and re-run `python ingest.py`. The Library page will automatically pick it up.
