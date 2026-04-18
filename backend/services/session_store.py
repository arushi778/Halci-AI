"""
In-memory session store.
Holds all active sessions and provides metrics + anomaly detection.

In production this would be Redis. For the demo, in-memory is sufficient.
"""
from datetime import datetime
from models import SessionState, SessionMetrics, AuditRecord
from config import settings


class SessionStore:
    def __init__(self):
        self._sessions: dict[str, SessionState] = {}

    def get(self, session_id: str) -> SessionState | None:
        return self._sessions.get(session_id)

    def get_or_create(self, session_id: str | None) -> SessionState:
        if session_id and session_id in self._sessions:
            return self._sessions[session_id]
        session = SessionState(session_id=session_id or None)
        if not session_id:
            session_id = session.session_id
        self._sessions[session_id] = session
        return session

    def update_metrics(self, session_id: str) -> None:
        """Recompute rolling metrics for a session."""
        session = self._sessions.get(session_id)
        if not session or not session.audits:
            return

        audits = session.audits
        total_sentences = sum(len(a.sentence_results) for a in audits)
        unsupported = sum(
            sum(1 for s in a.sentence_results if s.status == "unsupported")
            for a in audits
        )
        biased = sum(
            sum(1 for s in a.sentence_results if s.status == "biased")
            for a in audits
        )
        all_confidences = [
            s.confidence for a in audits for s in a.sentence_results
        ]

        session.metrics = SessionMetrics(
            hallucination_rate=round(unsupported / total_sentences, 3) if total_sentences else 0,
            bias_rate=round(biased / total_sentences, 3) if total_sentences else 0,
            avg_confidence=round(sum(all_confidences) / len(all_confidences), 3) if all_confidences else 0,
            total_sentences=total_sentences,
            total_audits=len(audits),
        )

    def check_anomalies(self, session_id: str) -> list[str]:
        """
        Check if rolling metrics breach thresholds.
        Returns list of human-readable alert strings.
        """
        session = self._sessions.get(session_id)
        if not session:
            return []

        alerts = []
        m = session.metrics

        if m.hallucination_rate >= settings.anomaly_hallucination_rate:
            pct = round(m.hallucination_rate * 100)
            alerts.append(
                f"🚨 Hallucination rate is {pct}% — above the {int(settings.anomaly_hallucination_rate*100)}% threshold. Model may be drifting."
            )

        recent_audits = session.audits[-10:]
        recent_bias = sum(
            sum(1 for s in a.sentence_results if s.status == "biased")
            for a in recent_audits
        )
        if recent_bias >= settings.anomaly_bias_count:
            alerts.append(
                f"🚨 {recent_bias} bias incidents in the last {len(recent_audits)} audits — potential systematic bias detected."
            )

        return alerts

    def find_audit(self, audit_id: str) -> AuditRecord | None:
        for session in self._sessions.values():
            for audit in session.audits:
                if audit.id == audit_id:
                    return audit
        return None


# Singleton instance
session_store = SessionStore()
