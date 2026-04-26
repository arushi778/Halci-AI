export interface PreFlightAnalysis {
  riskTier: 'low' | 'medium' | 'high';
  scores: {
    scopeAmbiguity: number;
    leadingLanguage: number;
    demographicTriggers: number;
    injectionPatterns: number;
  };
  suggestedRewrite?: string;
  explanation: string;
}

export interface SentenceAudit {
  text: string;
  status: 'clean' | 'warning' | 'error';
  checks: {
    hallucination: { status: 'pass' | 'fail' | 'uncertain'; explanation: string };
    bias: { status: 'pass' | 'fail' | 'uncertain'; explanation: string };
    consistency: { status: 'pass' | 'fail' | 'uncertain'; explanation: string };
  };
  sources?: { title: string; link: string }[];
}

export interface AnalysisResult {
  id: string;
  timestamp: number;
  prompt: string;
  output: string;
  preFlight: PreFlightAnalysis;
  sentenceAudits: SentenceAudit[];
  sessionMaturity: number; // 1-5
  overallScores: {
    bias: number;
    factuality: number;
    safety: number;
    consistency: number;
  };
  overallVerdict: string;
}
