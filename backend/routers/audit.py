"""
GET /api/audit/{audit_id}      — Fetch a single audit record
GET /api/audit/session/{id}    — Fetch all audits for a session
"""
from fastapi import APIRouter, HTTPException
from models import AuditRecord, SessionState
from services.session_store import session_store

router = APIRouter()


@router.get("/audit/session/{session_id}", response_model=SessionState)
async def get_session(session_id: str):
    """Return the full session state including all audit records."""
    session = session_store.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


@router.get("/audit/{audit_id}", response_model=AuditRecord)
async def get_audit(audit_id: str):
    """Return a single audit record by ID."""
    record = session_store.find_audit(audit_id)
    if not record:
        raise HTTPException(status_code=404, detail="Audit not found")
    return record
