"""
App configuration — reads from environment variables / .env file.
"""
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=[".env", "../.env"],   # check backend/.env then root .env
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # LLM
    gemini_api_key: str = ""

    # ChromaDB
    chroma_host: str = "localhost"
    chroma_port: int = 8001
    chroma_collection: str = "halci_knowledge"

    # CORS
    cors_origins: List[str] = ["http://localhost:5173"]

    # Thresholds
    hallucination_similarity_threshold: float = 0.45  # cosine sim below this = unsupported
    bias_delta_threshold: float = 15.0  # sentiment delta above this = biased
    anomaly_hallucination_rate: float = 0.20  # 20% = alert
    anomaly_bias_count: int = 3  # 3 incidents in last 10 = alert


settings = Settings()
