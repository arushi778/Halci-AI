"""
Gemini LLM client wrapper.
All calls to Gemini go through this module so they're easy to swap later.
"""
import json
from google import genai
from google.genai import types
from config import settings

# Single shared client
_client = genai.Client(api_key=settings.gemini_api_key)

GENERATION_MODEL = "gemini-2.0-flash"
AUDIT_MODEL = "gemini-2.0-flash"


async def generate_response(prompt: str, grounding_context: str = "") -> str:
    """
    Call Gemini to generate a response to the user's prompt.
    If grounding_context is provided, inject it as a system-level context block.
    """
    system = "You are a helpful, factual AI assistant. Answer the user's question accurately and concisely."
    if grounding_context:
        system += f"\n\nUse only the following verified context to answer. Do not invent facts:\n\n{grounding_context}"

    response = _client.models.generate_content(
        model=GENERATION_MODEL,
        contents=prompt,
        config=types.GenerateContentConfig(
            system_instruction=system,
            temperature=0.3,
        ),
    )
    return response.text


async def call_gemini_json(prompt: str, system: str, schema: dict) -> dict:
    """
    Call Gemini with structured JSON output.
    Returns parsed dict matching the provided schema.
    """
    response = _client.models.generate_content(
        model=AUDIT_MODEL,
        contents=prompt,
        config=types.GenerateContentConfig(
            system_instruction=system,
            response_mime_type="application/json",
            response_schema=schema,
            temperature=0.1,
        ),
    )
    return json.loads(response.text)
