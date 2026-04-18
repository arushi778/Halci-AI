"""
GET /api/metrics/{session_id}  — Rolling production metrics + anomaly alerts
"""
from fastapi import APIRouter, HTTPException
from models import MetricsResponse
from services.session_store import session_store

router = APIRouter()


@router.get("/metrics/{session_id}", response_model=MetricsResponse)
async def get_metrics(session_id: str):
    """
    Returns rolling metrics for the session.
    Used by the frontend to poll every 30s for the Production Monitor panel.
    """
    session = session_store.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    alerts = session_store.check_anomalies(session_id)

    return MetricsResponse(
        session_id=session_id,
        metrics=session.metrics,
        maturity=session.maturity,
        alerts=alerts,
        recent_audits=session.audits[-10:],  # Last 10 for trending
    )
