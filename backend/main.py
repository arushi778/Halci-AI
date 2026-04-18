"""
HALCI AI — FastAPI Backend Entry Point
TrustLens™ Integrity Framework
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from routers import proxy, audit, metrics
from services.rag import ensure_collection_exists, seed_knowledge_base


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: ensure ChromaDB collection exists and seed if empty."""
    print("[TrustLens] Backend starting...")
    try:
        await ensure_collection_exists()
        await seed_knowledge_base()
        print("[TrustLens] ChromaDB ready")
    except Exception as e:
        print(f"[TrustLens] WARNING: ChromaDB not available yet: {e}. RAG will be disabled.")
    yield
    print("[TrustLens] Backend shutting down.")


app = FastAPI(
    title="HALCI AI — TrustLens™ API",
    description="Bias and hallucination detection engine for LLM outputs.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(proxy.router, prefix="/api", tags=["proxy"])
app.include_router(audit.router, prefix="/api", tags=["audit"])
app.include_router(metrics.router, prefix="/api", tags=["metrics"])


@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "TrustLens API"}
