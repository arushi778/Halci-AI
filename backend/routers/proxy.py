"""
POST /api/proxy
───────────────
The core TrustLens intercept route.

Flow:
  1. Receive prompt
  2. Run pre-flight risk score
  3. If Medium/High risk → suggest rewrite (Gemini)
  4. Retrieve grounding docs from ChromaDB (if use_rag=True)
  5. Call Gemini with prompt + grounding context
  6. Run sentence-level audit on the response
  7. Compute overall scores + session maturity
  8. Check for anomalies, return full ProxyResponse
"""
import asyncio
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
import json

from models import ProxyRequest, ProxyResponse, AuditRecord, SessionMetrics
from services.risk_scorer import score_prompt
from services.sentence_audit import audit_sentences
from services.rag import retrieve_top_k
from services.llm_clients import generate_response
from services.session_store import session_store

router = APIRouter()


@router.post("/proxy", response_model=ProxyResponse)
async def proxy_endpoint(req: ProxyRequest):
    """
    Main TrustLens proxy endpoint.
    Intercepts the prompt, audits it, calls Gemini, audits the response.
    """
    # ── Step 1: Pre-flight risk score ─────────────────────────────────────
    prompt_audit = await score_prompt(req.prompt)

    # ── Step 2: RAG — retrieve grounding documents ─────────────────────────
    retrieved_docs = []
    grounding_context = ""
    if req.use_rag:
        retrieved_docs = await retrieve_top_k(req.prompt, k=5)
        if retrieved_docs:
            grounding_context = "\n\n".join(
                f"[Source: {d['source']}]\n{d['text']}" for d in retrieved_docs
            )

    # ── Step 3: Call Gemini (with grounding context injected) ─────────────
    llm_response = await generate_response(req.prompt, grounding_context)

    # ── Step 4: Sentence-level audit ──────────────────────────────────────
    sentence_results = await audit_sentences(
        llm_response, retrieved_docs
    )

    # ── Step 5: Compute overall scores ────────────────────────────────────
    total = len(sentence_results)
    if total == 0:
        overall_scores = {"factuality": 100, "bias_inverse": 100, "consistency": 100, "safety": 100}
    else:
        unsupported = sum(1 for s in sentence_results if s.status == "unsupported")
        biased = sum(1 for s in sentence_results if s.status == "biased")
        avg_conf = sum(s.confidence for s in sentence_results) / total

        factuality = round((1 - unsupported / total) * 100)
        bias_inverse = round((1 - biased / total) * 100)
        consistency = round(avg_conf * 100)
        safety = round((factuality + bias_inverse) / 2)

        overall_scores = {
            "factuality": factuality,
            "bias_inverse": bias_inverse,
            "consistency": consistency,
            "safety": safety,
        }

    # ── Step 6: Session maturity ───────────────────────────────────────────
    session = session_store.get_or_create(req.session_id)
    session_maturity = min(5, max(1, len(session.audits) + 1))

    # ── Step 7: Build audit record ─────────────────────────────────────────
    audit = AuditRecord(
        prompt=req.prompt,
        llm_response=llm_response,
        prompt_audit=prompt_audit,
        sentence_results=sentence_results,
        overall_scores=overall_scores,
        session_maturity=session_maturity,
        retrieved_docs=[d["source"] for d in retrieved_docs],
    )

    # ── Step 8: Update session ─────────────────────────────────────────────
    previous_audit = session.audits[-1] if session.audits else None
    session.audits.append(audit)
    session.maturity = session_maturity
    session_store.update_metrics(session.session_id)

    # ── Step 9: Anomaly detection ──────────────────────────────────────────
    alerts = session_store.check_anomalies(session.session_id)

    return ProxyResponse(
        session_id=session.session_id,
        audit=audit,
        previous_audit=previous_audit,
        alerts=alerts,
    )
