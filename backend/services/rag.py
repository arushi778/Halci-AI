"""
RAG Grounding Pipeline — Phase 3

ChromaDB integration for knowledge base storage and retrieval.
Uses the synchronous HttpClient (wrapped with asyncio) for compatibility
with chromadb 0.5.x.

- ensure_collection_exists(): Creates the collection on startup
- seed_knowledge_base(): Seeds with demo corpus if empty
- retrieve_top_k(): Fetches top-k relevant docs for a query
- query_sentence(): Checks a single sentence against the KB
"""
import asyncio
from concurrent.futures import ThreadPoolExecutor
from typing import Optional
import chromadb
from config import settings

# Thread pool for running synchronous ChromaDB calls without blocking the event loop
_executor = ThreadPoolExecutor(max_workers=4)

_client: Optional[chromadb.HttpClient] = None
_collection = None


def _get_client() -> chromadb.HttpClient:
    """Return (or create) a synchronous ChromaDB HTTP client."""
    global _client
    if _client is None:
        _client = chromadb.HttpClient(
            host=settings.chroma_host,
            port=settings.chroma_port,
        )
    return _client


def _get_or_create_collection():
    """Get or create the ChromaDB collection (synchronous)."""
    client = _get_client()
    return client.get_or_create_collection(
        name=settings.chroma_collection,
        metadata={"hnsw:space": "cosine"},
    )


async def ensure_collection_exists() -> None:
    """Create the ChromaDB collection if it doesn't exist."""
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(_executor, _get_or_create_collection)


async def retrieve_top_k(query: str, k: int = 5) -> list[dict]:
    """
    Query ChromaDB for the top-k most semantically similar documents.
    Returns list of { text, source, similarity, excerpt }
    """
    def _query():
        collection = _get_or_create_collection()
        return collection.query(
            query_texts=[query],
            n_results=min(k, collection.count()),
            include=["documents", "metadatas", "distances"],
        )

    try:
        loop = asyncio.get_event_loop()
        results = await loop.run_in_executor(_executor, _query)

        docs = []
        for doc, meta, dist in zip(
            results["documents"][0],
            results["metadatas"][0],
            results["distances"][0],
        ):
            similarity = 1.0 - dist  # cosine distance → similarity
            if similarity > 0.2:
                docs.append({
                    "text": doc,
                    "source": meta.get("source", "Unknown"),
                    "similarity": round(similarity, 3),
                    "excerpt": doc[:200] + "..." if len(doc) > 200 else doc,
                })
        return docs
    except Exception as e:
        print(f"[RAG] ChromaDB query failed: {e}")
        return []


async def query_sentence(sentence: str) -> Optional[dict]:
    """
    Query ChromaDB for the best matching doc for a single sentence.
    Used by the hallucination detector.
    """
    results = await retrieve_top_k(sentence, k=1)
    return results[0] if results else None


async def seed_knowledge_base() -> None:
    """
    Seed ChromaDB with the general-purpose knowledge base.
    Only runs if the collection is empty.
    """
    def _seed():
        collection = _get_or_create_collection()
        count = collection.count()
        if count > 0:
            print(f"[RAG] Knowledge base already has {count} documents. Skipping seed.")
            return False

        print("[RAG] Seeding knowledge base...")
        docs = KNOWLEDGE_BASE
        ids = [f"doc_{i}" for i in range(len(docs))]
        texts = [d["text"] for d in docs]
        metas = [{"source": d["source"], "category": d["category"]} for d in docs]
        collection.add(documents=texts, metadatas=metas, ids=ids)
        print(f"[RAG] Seeded {len(docs)} documents into ChromaDB.")
        return True

    loop = asyncio.get_event_loop()
    await loop.run_in_executor(_executor, _seed)


# ─── Demo Knowledge Base ──────────────────────────────────────────────────────
# ~48 factual snippets across AI/ML, Science, History, Technology.

KNOWLEDGE_BASE = [
    # AI / Machine Learning
    {"source": "AI Basics", "category": "ai", "text": "Large language models (LLMs) are neural networks trained on vast text corpora to predict the next token. They do not have access to real-time information unless augmented with tools or retrieval."},
    {"source": "AI Basics", "category": "ai", "text": "GPT-4 was released by OpenAI in March 2023. It is a multimodal model capable of processing both text and images."},
    {"source": "AI Basics", "category": "ai", "text": "Hallucination in LLMs refers to the generation of factually incorrect or fabricated information presented with high confidence."},
    {"source": "AI Basics", "category": "ai", "text": "Retrieval-Augmented Generation (RAG) is a technique that combines a retrieval system with a generative model to ground outputs in verified documents."},
    {"source": "AI Basics", "category": "ai", "text": "The Transformer architecture was introduced in the paper 'Attention Is All You Need' by Vaswani et al. in 2017 at Google Brain."},
    {"source": "AI Basics", "category": "ai", "text": "BERT (Bidirectional Encoder Representations from Transformers) was released by Google in 2018 and uses masked language modeling for pre-training."},
    {"source": "AI Basics", "category": "ai", "text": "Reinforcement Learning from Human Feedback (RLHF) is a technique used to align language models with human preferences by training a reward model on human ratings."},
    {"source": "AI Basics", "category": "ai", "text": "Gemini is a family of multimodal AI models developed by Google DeepMind, announced in December 2023."},
    {"source": "AI Ethics", "category": "ai", "text": "AI bias occurs when an algorithm produces systematically prejudiced results due to flawed assumptions in the training data or model design."},
    {"source": "AI Ethics", "category": "ai", "text": "The EU AI Act, adopted in 2024, is the world's first comprehensive legal framework for artificial intelligence, categorizing AI systems by risk level."},
    {"source": "AI Ethics", "category": "ai", "text": "Prompt injection is an attack where a malicious user embeds instructions in a prompt to override the LLM's original system instructions."},
    {"source": "AI Ethics", "category": "ai", "text": "Fairness in machine learning is typically measured using metrics like demographic parity, equalized odds, and individual fairness across protected groups."},
    # Science
    {"source": "Physics", "category": "science", "text": "The speed of light in a vacuum is approximately 299,792,458 meters per second (about 3x10^8 m/s)."},
    {"source": "Physics", "category": "science", "text": "Albert Einstein published his Special Theory of Relativity in 1905, which introduced the equation E=mc2."},
    {"source": "Physics", "category": "science", "text": "The Higgs boson was confirmed experimentally at CERN's Large Hadron Collider in July 2012."},
    {"source": "Biology", "category": "science", "text": "DNA (deoxyribonucleic acid) carries genetic information in living organisms. Its double helix structure was described by Watson and Crick in 1953."},
    {"source": "Biology", "category": "science", "text": "The human genome contains approximately 3 billion base pairs and around 20,000 to 25,000 protein-coding genes."},
    {"source": "Chemistry", "category": "science", "text": "Water (H2O) boils at 100 degrees Celsius (212 degrees Fahrenheit) at standard atmospheric pressure (1 atm)."},
    {"source": "Astronomy", "category": "science", "text": "The Milky Way galaxy contains an estimated 100 to 400 billion stars and is approximately 100,000 light-years in diameter."},
    {"source": "Astronomy", "category": "science", "text": "The Moon is Earth's only natural satellite, located approximately 384,400 km from Earth on average."},
    {"source": "Astronomy", "category": "science", "text": "Mars is the fourth planet from the Sun. It has two moons: Phobos and Deimos."},
    {"source": "Climate Science", "category": "science", "text": "Global average temperatures have risen approximately 1.1 degrees Celsius above pre-industrial levels as of 2022, according to the IPCC Sixth Assessment Report."},
    # History
    {"source": "World History", "category": "history", "text": "World War II lasted from 1939 to 1945. It involved most of the world's nations and resulted in an estimated 70 to 85 million fatalities."},
    {"source": "World History", "category": "history", "text": "The United Nations was founded on October 24, 1945, after the end of World War II, with 51 founding member states."},
    {"source": "World History", "category": "history", "text": "The Berlin Wall fell on November 9, 1989, leading to the reunification of East and West Germany in October 1990."},
    {"source": "World History", "category": "history", "text": "The French Revolution began in 1789 with the storming of the Bastille on July 14, 1789."},
    {"source": "World History", "category": "history", "text": "The Apollo 11 mission landed humans on the Moon on July 20, 1969. Neil Armstrong was the first human to walk on the lunar surface."},
    {"source": "World History", "category": "history", "text": "The Cold War was a period of geopolitical tension between the United States and the Soviet Union from approximately 1947 to 1991."},
    {"source": "World History", "category": "history", "text": "India gained independence from British rule on August 15, 1947."},
    {"source": "Ancient History", "category": "history", "text": "The Roman Empire fell in 476 AD when the last Western Roman Emperor, Romulus Augustulus, was deposed by Odoacer."},
    # Technology
    {"source": "Internet History", "category": "technology", "text": "The World Wide Web was invented by Tim Berners-Lee in 1989 while he was working at CERN."},
    {"source": "Internet History", "category": "technology", "text": "Apple's iPhone was released in 2007 and popularized modern touchscreen smartphones."},
    {"source": "Computing", "category": "technology", "text": "Moore's Law, proposed by Gordon Moore in 1965, observed that the number of transistors on a chip doubles approximately every two years."},
    {"source": "Computing", "category": "technology", "text": "The Linux kernel was created by Linus Torvalds and first released on September 17, 1991."},
    {"source": "Computing", "category": "technology", "text": "Python was created by Guido van Rossum and first released in 1991. It is widely used in data science, AI, and web development."},
    {"source": "Cybersecurity", "category": "technology", "text": "HTTPS uses TLS/SSL encryption to secure data transmitted between web browsers and servers."},
    {"source": "Social Media", "category": "technology", "text": "Facebook was founded by Mark Zuckerberg and launched in February 2004. It was renamed to Meta Platforms in October 2021."},
    # Medicine
    {"source": "Medicine", "category": "health", "text": "The COVID-19 pandemic was caused by the SARS-CoV-2 coronavirus. The World Health Organization declared it a pandemic on March 11, 2020."},
    {"source": "Medicine", "category": "health", "text": "Vaccines work by training the immune system to recognize and fight specific pathogens without causing the disease itself."},
    {"source": "Medicine", "category": "health", "text": "Penicillin, the first widely used antibiotic, was discovered by Alexander Fleming in 1928."},
    {"source": "Medicine", "category": "health", "text": "The human brain contains approximately 86 billion neurons and consumes about 20 percent of the body's total energy."},
    # Economics
    {"source": "Economics", "category": "economics", "text": "The 2008 global financial crisis was triggered by the collapse of the US housing bubble and the subsequent failure of mortgage-backed securities."},
    {"source": "Economics", "category": "economics", "text": "Bitcoin, the first decentralized cryptocurrency, was created by an entity known as Satoshi Nakamoto and launched in January 2009."},
    {"source": "Economics", "category": "economics", "text": "The World Bank estimated that approximately 700 million people live in extreme poverty, defined as living on less than $2.15 per day."},
]
