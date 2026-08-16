<p align="center">
  <img src="frontend/public/agapayLogo.png" alt="Agapay logo" width="112" />
</p>

<h1 align="center">Agapay</h1>

<p align="center">
  <strong>MSME Regulatory &amp; Compliance Navigator</strong><br />
  Practical, source-aware guidance for Filipino founders.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.10%2B-3776AB?logo=python&logoColor=white" alt="Python 3.10+" />
  <img src="https://img.shields.io/badge/FastAPI-0.141-009688?logo=fastapi&logoColor=white" alt="FastAPI 0.141" />
  <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=111827" alt="React 18" />
  <img src="https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white" alt="Vite 8" />
  <a href="https://github.com/nathanaellarida/agapay/actions/workflows/security.yml"><img src="https://github.com/nathanaellarida/agapay/actions/workflows/security.yml/badge.svg" alt="Security checks" /></a>
</p>

## Overview

Agapay is a persona-guided retrieval-augmented generation (RAG) prototype for
Filipino micro, small, and medium enterprises. It combines a React interface,
a FastAPI backend, locally generated embeddings, and a Groq-hosted language
model to turn a reviewed knowledge base into concise answers with source
snippets.

> [!IMPORTANT]
> Agapay is an independent prototype. It is not affiliated with, endorsed by,
> or an official service of eGovPH or any Philippine government agency. Its
> content is informational, may become outdated, and is not legal, tax, or
> regulatory advice. Verify requirements with the relevant agency before acting.

## Highlights

- Three mentor personas tailored to tech startups, online sellers, and local
  businesses.
- Retrieval-grounded answers based on the repository's reviewed text library.
- Source names and excerpts returned with every answer.
- Revision-pinned local embeddings with a validated JSON vector index.
- Provider credentials kept on the backend and out of the browser bundle.
- Dependency monitoring and automated security checks on the default branch.

## Mentor personas

| Persona | Role | Focus |
| --- | --- | --- |
| Anton | The Tech Strategist | Validation, scalability, funding readiness, the Innovative Startup Act, and DOST programs |
| Luz | The E-Commerce Pro | Registration, marketplace policies, and practical seller operations |
| Miko | The Local Builder | Permits, locations, fit-out, and LGU processes in Cebu and Lapu-Lapu |

## Architecture

```text
Reviewed .txt documents -> ingest.py -> local JSON vector index
                                               |
React + Vite -> /api proxy -> FastAPI -> retrieval -> Groq -> cited response
```

| Layer | Technology | Responsibility |
| --- | --- | --- |
| Frontend | React, Vite, Tailwind CSS | Persona selection, chat, citations, and knowledge-library views |
| API | FastAPI, Pydantic | Input validation, CORS, security headers, and response schemas |
| Retrieval | Sentence Transformers, NumPy | Local embeddings and similarity ranking |
| Generation | Groq-hosted Llama 3.3 70B | Persona-aware responses constrained to retrieved context |
| Automation | GitHub Actions, Dependabot | Dependency audits, build validation, and update monitoring |

The browser never receives the Groq API key. During local development, Vite
proxies `/api` requests to FastAPI on `127.0.0.1:8000`.

## Project structure

```text
agapay/
|-- .github/                 # Security workflow and Dependabot configuration
|-- backend/
|   |-- data/                # Reviewed plain-text knowledge base
|   |-- .env.example         # Safe configuration template
|   |-- ingest.py            # Local vector-index builder
|   |-- main.py              # FastAPI application
|   |-- rag_chain.py         # Retrieval and generation pipeline
|   `-- requirements.txt
|-- frontend/
|   |-- public/              # Logos and persona artwork
|   |-- src/                 # React application
|   |-- package.json
|   `-- vite.config.js
|-- README.md
`-- SECURITY.md
```

## Getting started

### Requirements

- Python 3.10 or newer
- Node.js `^20.19.0` or `>=22.12.0`
- A Groq API key

### 1. Clone the repository

```powershell
git clone https://github.com/nathanaellarida/agapay.git
Set-Location agapay
```

### 2. Start the backend

```powershell
Set-Location backend
python -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
Copy-Item .env.example .env
```

On macOS or Linux, activate the environment with
`source .venv/bin/activate` instead. Add your own `GROQ_API_KEY` to
`backend/.env`; that file is ignored by Git and must never be committed.

Build the local index and start the API:

```powershell
python ingest.py
uvicorn main:app --host 127.0.0.1 --port 8000
```

### 3. Start the frontend

Open a second terminal from the repository root:

```powershell
Set-Location frontend
npm ci
npm run dev
```

Visit `http://127.0.0.1:5173`.

## API reference

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/health` | Return the service liveness status |
| `GET` | `/personas` | List the available mentor personas |
| `GET` | `/library` | List indexed knowledge-base documents |
| `POST` | `/query` | Answer a question with the selected persona and retrieved sources |

The interactive OpenAPI documentation is available at
`http://127.0.0.1:8000/docs` while the backend is running.

## Configuration

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `GROQ_API_KEY` | Yes | None | Authenticates server-side model requests |
| `DATA_DIR` | No | `./data` | Locates reviewed `.txt` source documents inside `backend` |
| `INDEX_PATH` | No | `./vector_index.json` | Locates the generated local vector index inside `backend` |
| `CORS_ORIGINS` | No | Local Vite origins | Comma-separated browser origins allowed to call the API |

## Updating the knowledge base

Place reviewed, public `.txt` files in `backend/data`, then run
`python ingest.py` again from the backend directory. Do not ingest confidential,
personal, licensed, or internal material: the API returns source excerpts to
clients.

## Security and responsible use

- Keep credentials in `backend/.env` locally or in a managed secret store for
  deployment.
- Run `npm run security:audit` in `frontend` and
  `python -m pip_audit -r backend/requirements.txt` before releases.
- Review source material regularly because permits, fees, programs, and agency
  procedures can change.
- Do not expose the development servers directly to the internet. A production
  deployment still needs authentication, TLS, rate limiting, request-size
  limits, centralized secrets, and a trusted reverse proxy.
- Report vulnerabilities privately as described in [SECURITY.md](SECURITY.md).

This repository is a prototype, not a production-ready public service.
