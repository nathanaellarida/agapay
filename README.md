# Agapay — MSME Regulatory & Compliance Navigator

Agapay is a retrieval-augmented regulatory assistant for Filipino micro, small,
and medium enterprises. It combines a React interface with a FastAPI backend,
local embeddings, a validated local vector index, and a Groq-hosted language model.

> [!IMPORTANT]
> Agapay is an independent prototype. It is not affiliated with, endorsed by,
> or an official service of eGovPH or any Philippine government agency. Its
> content is informational, may become outdated, and is not legal, tax, or
> regulatory advice. Verify requirements with the relevant agency before acting.

## Stack

| Layer | Technology |
| --- | --- |
| Frontend | React, Vite, Tailwind CSS |
| Backend | FastAPI, Pydantic |
| Retrieval | Revision-pinned sentence embeddings and a local JSON vector index |
| Embeddings | `sentence-transformers/all-MiniLM-L6-v2`, pinned to a reviewed revision |
| Language model | Groq-hosted Llama 3.3 70B |

## Local setup

Requirements: Python 3.10 or newer and Node.js 24 or newer.

### Backend

```powershell
Set-Location backend
python -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
Copy-Item .env.example .env
```

Edit `backend/.env` and set your own `GROQ_API_KEY`. The `.env` file is ignored
by Git and must never be committed.

```powershell
python ingest.py
uvicorn main:app --port 8000
```

The API listens on `http://127.0.0.1:8000` by default.

### Frontend

```powershell
Set-Location frontend
npm ci
npm run dev
```

The frontend listens on `http://127.0.0.1:5173` and proxies `/api` requests to
the local backend.

## API

- `GET /health` — liveness response
- `GET /personas` — available mentor personas
- `GET /library` — indexed public knowledge-base documents
- `POST /query` — answer a question using the selected persona and retrieved sources

## Adding documents

Place reviewed, public `.txt` files in `backend/data` and run `python ingest.py`
again. Do not ingest confidential, personal, licensed, or internal material: the
API returns source snippets to clients.

## Security

- Keep all provider credentials in `backend/.env` or a production secret store.
- Never expose the FastAPI development server directly to the internet.
- A production deployment must add authentication, TLS, rate limiting,
  request-size limits, centralized secret management, and a trusted reverse proxy.
- Run `npm run security:audit` in `frontend` and
  `python -m pip_audit -r backend/requirements.txt` before releases.
- Report vulnerabilities privately as described in [SECURITY.md](SECURITY.md).

Dependabot and the security workflow monitor npm, Python, and GitHub Actions
dependencies on the default branch.
