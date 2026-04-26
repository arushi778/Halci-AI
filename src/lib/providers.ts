/**
 * Multi-provider LLM response generation
 * Supports: Gemini, Groq
 */

export type ProviderId = 'gemini' | 'groq';

export interface ProviderConfig {
  id: ProviderId;
  name: string;
  icon: string;
  color: string;
  bgColor: string;
  borderColor: string;
  models: { id: string; label: string }[];
  requiresKey: boolean;
  keyEnvVar?: string;
  placeholder?: string;
}

export const PROVIDERS: ProviderConfig[] = [
  {
    id: 'gemini',
    name: 'Gemini',
    icon: '✦',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    models: [
      { id: 'gemini-3-flash-preview', label: 'Gemini 3 Flash' },
    ],
    requiresKey: true,
    keyEnvVar: 'GEMINI_API_KEY',
    placeholder: 'AIza...',
  },

  {
    id: 'groq',
    name: 'Groq',
    icon: '⚡',
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/30',
    models: [
      { id: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B' },
    ],
    requiresKey: true,
    keyEnvVar: 'GROQ_API_KEY',
    placeholder: 'gsk_...',
  },

];

export function getProvider(id: ProviderId): ProviderConfig {
  return PROVIDERS.find((p) => p.id === id)!;
}

// ── Gemini ────────────────────────────────────────────────────────────────────
async function callGemini(prompt: string, model: string, apiKey: string): Promise<string> {
  const { GoogleGenAI } = await import('@google/genai');
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      systemInstruction: 'You are a helpful AI assistant. Respond to the user\'s prompt with a detailed, well-structured answer.',
    },
  });
  return response.text ?? '';
}

// ── Groq ──────────────────────────────────────────────────────────────────────
async function callGroq(prompt: string, model: string, apiKey: string): Promise<string> {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: 'You are a helpful AI assistant. Respond with a detailed, well-structured answer.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Groq error: ${err?.error?.message ?? res.statusText}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? '';
}



// ── Read credentials from env ─────────────────────────────────────────────────
function getCredential(providerId: ProviderId): string {
  const env = import.meta.env;
  switch (providerId) {
    case 'gemini': return env.VITE_GEMINI_API_KEY ?? '';

    case 'groq':   return env.VITE_GROQ_API_KEY ?? '';
    default:       return '';
  }
}

/** Check whether a provider's API key is configured in .env.local */
export function isProviderConfigured(providerId: ProviderId): boolean {
  const cred = getCredential(providerId);
  return cred.length > 0 && !cred.startsWith('your_');
}

// ── Unified entry point ───────────────────────────────────────────────────────
export async function generateWithProvider(
  prompt: string,
  providerId: ProviderId,
): Promise<string> {
  const credential = getCredential(providerId);

  if (!credential || credential.startsWith('your_')) {
    const provider = PROVIDERS.find((p) => p.id === providerId)!;
    throw new Error(
      `${provider.name} API key not configured. Add your key to .env.local as VITE_${providerId.toUpperCase()}_API_KEY`
    );
  }

  const provider = PROVIDERS.find((p) => p.id === providerId)!;
  const model = provider.models[0].id;

  switch (providerId) {
    case 'gemini':
      return callGemini(prompt, model, credential);

    case 'groq':
      return callGroq(prompt, model, credential);
    default:
      throw new Error(`Unknown provider: ${providerId}`);
  }
}

