# Halci AI — TrustLens™ Integrity Framework

A local bias and hallucination detection engine for LLM outputs, powered by Google Gemini.

## What it does

Halci AI runs every prompt and LLM response through a **6-step TrustLens™ audit**:

| Step | Name | What it does |
|------|------|--------------|
| 1 | Pre-flight Audit | Analyses prompts across 4 risk axes before sending to any LLM |
| 2 | LLM Generation | Lets you bring back any model's response for auditing |
| 3–4 | Sentence-Level Audit | Colours each sentence Green / Amber / Red for hallucination, bias, and consistency |
| 5 | Iteration Delta | Shows before/after score diffs when you refine a prompt |
| 6 | Production Monitor | Rolling metrics dashboard for bias spikes and model drift |

## Prerequisites

- **Node.js** ≥ 18
- A **Gemini API key** — get one free at [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)

## Getting started

```bash
# 1. Install dependencies
npm install

# 2. Add your API key
cp .env.example .env.local
# Then edit .env.local and replace `your_gemini_api_key_here` with your real key

# 3. Start the dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Project structure

```
halci-ai/
├── src/
│   ├── App.tsx          # Main UI — all 6 TrustLens™ steps
│   ├── main.tsx         # React entry point
│   ├── index.css        # Global styles (Tailwind)
│   ├── types.ts         # TypeScript interfaces
│   └── lib/
│       ├── gemini.ts    # Gemini API calls (pre-flight + full audit)
│       └── utils.ts     # Tailwind class helpers
├── .env.example         # Template — copy to .env.local
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Building for production

```bash
npm run build
# Output is in dist/ — serve with any static host (Vercel, Netlify, etc.)
```

> ⚠️ **Security note:** The Gemini API key is embedded in the frontend bundle at build time.
> This is fine for local use. For a public deployment, move API calls to a backend proxy
> and keep the key server-side only.

## Tech stack

- **React 19** + **TypeScript**
- **Vite 6** for bundling
- **Tailwind CSS v4** for styling
- **Framer Motion** for transitions
- **Recharts** for the Integrity Radar chart
- **@google/genai** SDK for Gemini 3 Flash
