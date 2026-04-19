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

    try:
        response = _client.models.generate_content(
            model=GENERATION_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=system,
                temperature=0.3,
            ),
        )
        return response.text
    except Exception as e:
        print(f"[Gemini API Error] {e}")
        return "This is a fallback response. The Gemini API quota was exceeded (429 errors)."


async def call_gemini_json(prompt: str, system: str, schema: dict) -> dict:
    """
    Call Gemini with structured JSON output.
    Returns parsed dict matching the provided schema.
    """
    try:
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
    except Exception as e:
        print(f"[Gemini API Error] {e}")
        # Detect what type of schema we are mocking to provide a safe fallback
        if schema.get("type") == "array":
            # Mock the batch audit response for sentences
            return [{
                "sentence_index": 0,
                "bias_verdict": "uncertain",
                "bias_delta": 30,
                "bias_explanation": "Mocked validation due to API quota limit.",
                "consistency_verdict": "uncertain",
                "consistency_explanation": "Mocked validation due to API quota limit.",
                "consistency_confidence": 0.5
            }]
        else:
            # Mock the prompt risk scorer response
            return {
                "risk_tier": "low",
                "scores": {
                    "scope_ambiguity": 10,
                    "leading_language": 10,
                    "demographic_triggers": 10,
                    "injection_patterns": 10
                },
                "explanation": "This is a fallback audit. The Gemini API quota was exceeded."
            }
