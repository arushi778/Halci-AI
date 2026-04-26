"""
Shared Pydantic data models for HALCI AI.
These are the canonical types used across all routes and services.
"""
from __future__ import annotations
from pydantic import BaseModel, Field
from typing import Literal, Optional
from datetime import datetime
import uuid


# ─── Risk Scoring ────────────────────────────────────────────────────────────

class RiskScores(BaseModel):
    scope_ambiguity: float = Field(..., ge=0, le=100, description="Vague prompts score")
    leading_language: float = Field(..., ge=0, le=100, description="Bias-steering score")
    demographic_triggers: float = Field(..., ge=0, le=100, description="Group comparison risk")
    injection_patterns: float = Field(..., ge=0, le=100, description="Safety override attempt")


class PromptAudit(BaseModel):
    risk_tier: Literal["low", "medium", "high"]
    scores: RiskScores
    suggested_rewrite: Optional[str] = None
    explanation: str


# ─── Sentence-Level Audit ────────────────────────────────────────────────────

class CheckResult(BaseModel):
    status: Literal["pass", "fail", "uncertain"]
    explanation: str
    confidence: float = Field(..., ge=0.0, le=1.0)


class SentenceChecks(BaseModel):
    hallucination: CheckResult
    bias: CheckResult
    consistency: CheckResult


class SentenceResult(BaseModel):
    text: str
    status: Literal["grounded", "biased", "unsupported"]
    confidence: float = Field(..., ge=0.0, le=1.0)
    source_doc: Optional[str] = None       # RAG: which doc grounded this sentence
    source_excerpt: Optional[str] = None   # Short excerpt from grounding doc
    checks: SentenceChecks


# ─── Session State ───────────────────────────────────────────────────────────

class SessionMetrics(BaseModel):
    hallucination_rate: float = 0.0   # % of sentences flagged unsupported
    bias_rate: float = 0.0            # % of sentences flagged biased
    avg_confidence: float = 0.0
    total_sentences: int = 0
    total_audits: int = 0


class AuditRecord(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    prompt: str
    llm_response: str
    prompt_audit: PromptAudit
    sentence_results: list[SentenceResult]
    overall_scores: dict[str, float]      # factuality, bias_inverse, consistency, safety
    session_maturity: int = Field(..., ge=1, le=5)
    retrieved_docs: list[str] = Field(default_factory=list)


class SessionState(BaseModel):
    session_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=datetime.utcnow)
    maturity: int = 1
    audits: list[AuditRecord] = Field(default_factory=list)
    metrics: SessionMetrics = Field(default_factory=SessionMetrics)


# ─── API Request / Response ──────────────────────────────────────────────────

class ProxyRequest(BaseModel):
    prompt: str
    session_id: Optional[str] = None
    use_rag: bool = True      # Whether to inject retrieved docs into context


class ProxyResponse(BaseModel):
    session_id: str
    audit: AuditRecord
    previous_audit: Optional[AuditRecord] = None   # For diff view
    alerts: list[str] = Field(default_factory=list)  # Anomaly alert messages
    maturity_detail: Optional[dict] = None           # Level, label, tip, scores


class MetricsResponse(BaseModel):
    session_id: str
    metrics: SessionMetrics
    maturity: int
    alerts: list[str] = Field(default_factory=list)
    recent_audits: list[AuditRecord] = Field(default_factory=list)
