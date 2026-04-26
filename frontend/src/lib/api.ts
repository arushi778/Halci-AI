/**
 * api.ts
 * Type-safe API client for calling the FastAPI backend.
 */

export interface RiskScores {
  scope_ambiguity: number;
  leading_language: number;
  demographic_triggers: number;
  injection_patterns: number;
}

export interface PromptAudit {
  risk_tier: string;
  scores: RiskScores;
  explanation: string;
  suggested_rewrite: string | null;
}

export interface CheckResult {
  status: string;
  explanation: string;
  confidence: number;
}

export interface SentenceResult {
  text: string;
  status: string;
  confidence: number;
  source_doc: string | null;
  source_excerpt: string | null;
  checks: {
    hallucination: CheckResult;
    bias: CheckResult;
    consistency: CheckResult;
  };
}

export interface AuditRecord {
  id: string;
  prompt: string;
  llm_response: string;
  prompt_audit: PromptAudit;
  sentence_results: SentenceResult[];
  overall_scores: {
    factuality: number;
    bias_inverse: number;
    consistency: number;
    safety: number;
  };
  session_maturity: number;
}

export interface MaturityDetail {
  level: number;          // 1–5
  label: string;          // "Elite", "Advanced", etc.
  tip: string;            // coaching message
  scores: {
    hallucination_pct: number;
    bias_pct: number;
    consistency_pct: number;
  };
}

export interface ProxyRequest {
  prompt: string;
  use_rag?: boolean;
  session_id?: string;
}

export interface ProxyResponse {
  session_id: string;
  audit: AuditRecord;
  previous_audit: AuditRecord | null;
  alerts?: string[];
  maturity_detail?: MaturityDetail;
}

/**
 * Calls the backend /api/proxy endpoint which handles both pre-flight scoring
 * and full sentence auditing in a single request.
 */
export async function runTrustLensProxy(request: ProxyRequest): Promise<ProxyResponse> {
  const response = await fetch('/api/proxy', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorDetails = await response.text();
    throw new Error(`Proxy error: ${response.status} ${response.statusText} - ${errorDetails}`);
  }

  return response.json();
}
