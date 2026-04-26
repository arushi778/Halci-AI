# HALCI AI — TrustLens™ Integrity Framework

> **H**allucination & **A**I **L**LM **C**onsistency **I**nspector  
> A real-time bias and hallucination detection engine for LLM outputs, powered by Google Gemini, ChromaDB, and a React + TypeScript frontend.

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
  - [1. Clone the Repository](#1-clone-the-repository)
  - [2. Configure Environment Variables](#2-configure-environment-variables)
  - [3. Run with Docker (Recommended)](#3-run-with-docker-recommended)
  - [4. Run Locally (Manual)](#4-run-locally-manual)
- [API Reference](#api-reference)
- [How It Works](#how-it-works)
- [Session Maturity Levels](#session-maturity-levels)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

**HALCI AI** is an open-source LLM auditing platform that wraps around your AI prompts and responses to detect hallucinations, bias, and logical inconsistencies — in real time, at the sentence level.

Every prompt you send passes through the **TrustLens™ Integrity Framework**, which:
1. Scores the **incoming prompt** for potential risks before it ever reaches the LLM.
2. Queries a **local ChromaDB knowledge base** to ground the response in facts (RAG).
3. Audits every **sentence of the LLM response** for hallucination, demographic bias, and internal consistency.
4. Tracks a **session maturity score** (L1–L5) that evolves as you interact.

---

## Key Features

| Feature | Description |
|---|---|
| 🔍 **Pre-flight Prompt Risk Scoring** | Scores prompts on 4 axes: scope ambiguity, leading language, demographic triggers, and injection patterns. Suggests a safer rewrite when needed. |
| 🧠 **Sentence-Level Audit Engine** | Splits LLM responses into individual sentences and runs hallucination, bias, and consistency checks on each one in parallel. |
| 📚 **RAG Grounding** | Uses ChromaDB for retrieval-augmented generation — retrieved docs are injected into the prompt and used to verify response claims. |
| 📊 **Session Maturity Tracker** | Computes a rolling L1–L5 maturity score based on your session-wide hallucination rate, bias rate, and average confidence. |
| 🚨 **Anomaly Detection** | Alerts you when session-level metrics cross dangerous thresholds mid-session. |
| 🖨️ **Audit Report Export** | Full print-ready audit report view for any individual query result. |
| 🔀 **Multi-Provider Support** | Frontend supports Gemini, OpenAI, and Groq API keys — swap providers without changing code. |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      React + TypeScript UI                       │
│   (Vite · Tailwind CSS · Recharts · Lucide React · Motion)       │
└─────────────────────────┬───────────────────────────────────────┘
                          │  POST /api/proxy
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│              FastAPI Backend — TrustLens™ Proxy                  │
│                                                                  │
│  1. Risk Scorer   ──► Gemini (4-axis prompt audit)               │
│  2. RAG Retrieval ──► ChromaDB (top-5 knowledge docs)            │
│  3. LLM Call      ──► Gemini (prompt + grounding context)        │
│  4. Sentence Audit──► ChromaDB (hallucination) + Gemini (bias,  │
│                        consistency) — parallel, batched          │
│  5. Maturity Score──► Threshold-based L1–L5 computation         │
│  6. Session Store ──► In-memory audit history + anomaly checks   │
└─────────────────────────────────────────────────────────────────┘
                          │
                          ▼
                    ┌──────────┐
                    │ ChromaDB │  (Vector store — grounding knowledge base)
                    └──────────┘
```

---

## Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| **FastAPI** | Async REST API framework |
| **Google Gemini** (`google-genai`) | LLM calls, bias scoring, consistency checking |
| **ChromaDB** | Local vector database for RAG grounding |
| **spaCy** (`en_core_web_sm`) | Sentence boundary detection |
| **Pydantic v2** | Request / response model validation |
| **Uvicorn** | ASGI server |
| **Tenacity** | Retry logic for LLM API calls |

### Frontend
| Technology | Purpose |
|---|---|
| **React 19 + TypeScript** | UI framework |
| **Vite 6** | Build tool and dev server |
| **Tailwind CSS v4** | Utility-first styling |
| **Recharts** | Score visualisation charts |
| **Motion** | Animations and transitions |
| **Lucide React** | Icon library |

### Infrastructure
| Technology | Purpose |
|---|---|
| **Docker / Docker Compose** | Containerised deployment of all three services |

---

## Project Structure

```
HALCI AI/
├── backend/                        # FastAPI Python backend
│   ├── main.py                     # Application entry point, middleware, lifespan
│   ├── config.py                   # Settings loaded from environment variables
│   ├── models.py                   # Pydantic data models (requests, responses, audit records)
│   ├── requirements.txt            # Python dependencies
│   ├── Dockerfile                  # Backend Docker image
│   ├── routers/
│   │   ├── proxy.py                # POST /api/proxy — core TrustLens intercept route
│   │   ├── audit.py                # GET /api/audit — session audit history
│   │   └── metrics.py              # GET /api/metrics — session-level metric aggregates
│   └── services/
│       ├── llm_clients.py          # Gemini API wrappers (text + structured JSON)
│       ├── risk_scorer.py          # Pre-flight 4-axis prompt risk scoring
│       ├── sentence_audit.py       # Sentence-level hallucination, bias & consistency audit
│       ├── rag.py                  # ChromaDB retrieval — seeding, querying, similarity
│       ├── maturity_scorer.py      # Session L1–L5 maturity computation
│       └── session_store.py        # In-memory session state + anomaly detection
│
├── src/                            # React + TypeScript frontend
│   ├── App.tsx                     # Main application component, routing, state
│   ├── main.tsx                    # React DOM entry point
│   ├── index.css                   # Global styles
│   ├── types.ts                    # Shared TypeScript type definitions
│   ├── components/
│   │   ├── ModelSelector.tsx       # LLM provider picker (Gemini / OpenAI / Groq)
│   │   └── ReportPrintView.tsx     # Full print-ready audit report component
│   └── lib/                        # Shared utility helpers
│
├── index.html                      # HTML entry point
├── vite.config.ts                  # Vite + React plugin configuration
├── tsconfig.json                   # TypeScript compiler configuration
├── package.json                    # Frontend dependencies and scripts
├── docker-compose.yml              # Multi-service Docker orchestration
├── .env.example                    # Environment variable template
└── .gitignore
```

---

## Prerequisites

- **Node.js** ≥ 18 and **npm** ≥ 9
- **Python** ≥ 3.11
- **Docker** + **Docker Compose** (for the recommended Docker setup)
- API keys for at least one LLM provider (see below)

---

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/halci-ai.git
cd halci-ai
```

### 2. Configure Environment Variables

Copy the example file and fill in your keys:

```bash
cp .env.example .env.local
```

Open `.env.local` and add your API keys:

```env
# Google Gemini — https://aistudio.google.com/app/apikey
VITE_GEMINI_API_KEY=your_gemini_api_key_here

# OpenAI (optional) — https://platform.openai.com/api-keys
VITE_OPENAI_API_KEY=your_openai_api_key_here

# Groq (optional) — https://console.groq.com/keys
VITE_GROQ_API_KEY=your_groq_api_key_here

# Google Custom Search API (powers backend RAG web-search seeding)
GOOGLE_SEARCH_API_KEY=your_google_api_key_here
GOOGLE_SEARCH_CX=your_search_engine_id_here
```

> **Note:** Only `VITE_GEMINI_API_KEY` is required to run the core audit pipeline. The others unlock additional providers and RAG search seeding.

---

### 3. Run with Docker (Recommended)

Docker Compose starts all three services — ChromaDB, the FastAPI backend, and the React frontend — in the correct order:

```bash
docker-compose up --build
```

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8000 |
| API Docs (Swagger) | http://localhost:8000/docs |
| ChromaDB | http://localhost:8001 |

To stop all services:

```bash
docker-compose down
```

---

### 4. Run Locally (Manual)

#### Backend

```bash
cd backend

# Create and activate a virtual environment
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS / Linux

# Install dependencies
pip install -r requirements.txt

# Download the spaCy language model
python -m spacy download en_core_web_sm

# Start the API server
uvicorn main:app --reload --port 8000
```

The backend will be available at **http://localhost:8000**.  
Interactive API docs: **http://localhost:8000/docs**

#### Frontend

In a new terminal (from the project root):

```bash
# Install dependencies
npm install

# Start the dev server
npm run dev
```

The frontend will be available at **http://localhost:5173**.

---

## API Reference

The full interactive API reference is auto-generated by FastAPI at `/docs` (Swagger UI) and `/redoc`.

### Core Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Health check — returns `{ status: "ok" }` |
| `POST` | `/api/proxy` | Main TrustLens intercept — submits a prompt and returns a full audit |
| `GET` | `/api/audit/{session_id}` | Returns the full audit history for a session |
| `GET` | `/api/metrics/{session_id}` | Returns aggregated session-level metrics |

### `POST /api/proxy` — Request Body

```json
{
  "prompt": "Your question or instruction for the LLM",
  "session_id": "optional-uuid-to-continue-a-session",
  "use_rag": true
}
```

### `POST /api/proxy` — Response (abbreviated)

```json
{
  "session_id": "uuid",
  "audit": {
    "prompt": "...",
    "llm_response": "...",
    "prompt_audit": {
      "risk_tier": "low | medium | high",
      "scores": { "scope_ambiguity": 12, "leading_language": 5, ... },
      "explanation": "...",
      "suggested_rewrite": "..."
    },
    "sentence_results": [
      {
        "text": "Individual sentence from the response.",
        "status": "grounded | unsupported | biased",
        "confidence": 0.91,
        "source_doc": "Wikipedia: ...",
        "checks": {
          "hallucination": { "status": "pass", "confidence": 0.91, "explanation": "..." },
          "bias":          { "status": "pass", "confidence": 0.95, "explanation": "..." },
          "consistency":   { "status": "pass", "confidence": 0.88, "explanation": "..." }
        }
      }
    ],
    "overall_scores": { "factuality": 94, "bias_inverse": 100, "consistency": 89, "safety": 97 },
    "session_maturity": 4
  },
  "maturity_detail": {
    "level": 4,
    "label": "Advanced",
    "tip": "Strong trust signals — minor refinement needed.",
    "scores": { "hallucination_pct": 6, "bias_pct": 0, "consistency_pct": 89 }
  },
  "alerts": []
}
```

---

## How It Works

The TrustLens pipeline runs synchronously for each request, internally parallelising where safe:

```
User Prompt
    │
    ▼
[1] Pre-Flight Risk Score (Gemini)
    ├── scope_ambiguity
    ├── leading_language
    ├── demographic_triggers
    └── injection_patterns → risk_tier: low / medium / high

    │
    ▼
[2] RAG Retrieval (ChromaDB)
    └── top-5 semantically similar knowledge-base documents injected as context

    │
    ▼
[3] LLM Call (Gemini)
    └── Prompt + grounding context → llm_response

    │
    ▼
[4] Sentence-Level Audit (parallel)
    ├── Hallucination — ChromaDB similarity check per sentence
    ├── Bias          — Gemini demographic sentiment delta (batched)
    └── Consistency   — Gemini contradiction / drift check (batched)

    │
    ▼
[5] Overall Scores
    ├── Factuality  = 1 − (unsupported sentences / total)
    ├── Bias Inverse= 1 − (biased sentences / total)
    ├── Consistency = average sentence confidence
    └── Safety      = (Factuality + Bias Inverse) / 2

    │
    ▼
[6] Session Maturity Level (L1–L5)
    └── Rolling hallucination rate, bias rate, avg confidence → threshold lookup

    │
    ▼
[7] Anomaly Detection
    └── Alerts if session-level rates cross danger thresholds

    │
    ▼
Full ProxyResponse returned to frontend
```

---

## Session Maturity Levels

As you interact with the system, HALCI AI tracks a rolling session maturity score across all your audits:

| Level | Label | Hallucination | Bias | Consistency | Coaching Tip |
|---|---|---|---|---|---|
| **L5** | 🟢 Elite | < 5% | < 5% | ≥ 85% | Outstanding integrity — production-ready. |
| **L4** | 🔵 Advanced | < 15% | < 15% | ≥ 70% | Strong trust signals — minor refinement needed. |
| **L3** | 🟡 Developing | < 30% | < 30% | ≥ 55% | Moderate issues detected — iterate prompts. |
| **L2** | 🟠 Emerging | < 50% | < 50% | ≥ 40% | Significant reliability gaps — tighten prompts. |
| **L1** | 🔴 Novice | ≥ 50% | ≥ 50% | < 40% | High hallucination or bias — review prompt strategy. |

---

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository and create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes and ensure existing functionality is not broken.
3. Run the backend tests: `python -m pytest backend/`
4. Open a pull request with a clear description of your changes.

---

## License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

---

<p align="center">Built with ❤️ by the HALCI AI team &nbsp;·&nbsp; Powered by Google Gemini</p>
