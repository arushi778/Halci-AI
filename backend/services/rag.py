"""
RAG Grounding Pipeline — Phase 3 (Wikipedia & Google API)

Uses Wikipedia and Google Custom Search APIs for dynamic knowledge base retrieval.
"""
import asyncio
from concurrent.futures import ThreadPoolExecutor
from typing import Optional
import os
import wikipedia
import httpx

_executor = ThreadPoolExecutor(max_workers=4)

async def ensure_collection_exists() -> None:
    # No longer needed, kept for compatibility with main.py
    pass

async def seed_knowledge_base() -> None:
    # No longer needed, kept for compatibility with main.py
    pass

def _fetch_wikipedia(query: str, k: int = 5) -> list[dict]:
    try:
        # Search for titles based on the query
        titles = wikipedia.search(query, results=k)
        docs = []
        for title in titles:
            try:
                # Fetch page summary
                page = wikipedia.page(title, auto_suggest=False)
                summary = page.summary
                docs.append({
                    "text": summary,
                    "source": f"Wikipedia: {title}",
                    "similarity": 1.0,
                    "excerpt": summary[:200] + "..." if len(summary) > 200 else summary
                })
            except Exception:
                continue
        return docs
    except Exception as e:
        print(f"[RAG] Wikipedia search failed: {e}")
        return []

def _fetch_google(query: str, k: int = 5) -> list[dict]:
    google_api_key = os.environ.get("GOOGLE_SEARCH_API_KEY")
    google_cx = os.environ.get("GOOGLE_SEARCH_CX")
    
    # If API keys are not provided, gracefully skip Google Search
    if not google_api_key or not google_cx:
        return []
        
    try:
        url = "https://www.googleapis.com/customsearch/v1"
        params = {
            "key": google_api_key,
            "cx": google_cx,
            "q": query,
            "num": min(k, 10)
        }
        with httpx.Client(timeout=10.0) as client:
            response = client.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            
            docs = []
            for item in data.get("items", []):
                snippet = item.get("snippet", "")
                docs.append({
                    "text": snippet,
                    "source": item.get("link", "Google Search"),
                    "similarity": 1.0,
                    "excerpt": snippet[:200] + "..." if len(snippet) > 200 else snippet
                })
            return docs
    except Exception as e:
        print(f"[RAG] Google Search failed: {e}")
        return []

async def retrieve_top_k(query: str, k: int = 5) -> list[dict]:
    """
    Query Wikipedia and Google Search for relevant documents.
    Returns list of { text, source, similarity, excerpt }
    """
    loop = asyncio.get_event_loop()
    
    # Run searches in parallel
    wiki_task = loop.run_in_executor(_executor, _fetch_wikipedia, query, k)
    google_task = loop.run_in_executor(_executor, _fetch_google, query, k)
    
    wiki_docs, google_docs = await asyncio.gather(wiki_task, google_task)
    
    # Combine results and take the top k
    docs = wiki_docs + google_docs
    return docs[:k]

async def query_sentence(sentence: str) -> Optional[dict]:
    """
    Query Wikipedia/Google for the best matching doc for a single sentence.
    Used by the hallucination detector.
    """
    results = await retrieve_top_k(sentence, k=1)
    return results[0] if results else None
