"""
MaturityScorer
──────────────
Computes a session maturity level (L1–L5) from the running average of
hallucination rate, bias rate, and consistency score across all audits
in the session.

Threshold logic:
  L5 — Elite:        hal < 5%,  bias < 5%,  consistency >= 85%
  L4 — Advanced:     hal < 15%, bias < 15%, consistency >= 70%
  L3 — Developing:   hal < 30%, bias < 30%, consistency >= 55%
  L2 — Emerging:     hal < 50%, bias < 50%, consistency >= 40%
  L1 — Novice:       anything else

Labels & descriptions surfaced to the frontend:
  Each level has a short label and a one-liner coaching tip.
"""

from models import SessionMetrics

MATURITY_THRESHOLDS = [
    # (level, label, tip, max_hallucination, max_bias, min_consistency)
    (5, "Elite",      "Outstanding integrity — production-ready.",
     0.05, 0.05, 0.85),
    (4, "Advanced",   "Strong trust signals — minor refinement needed.",
     0.15, 0.15, 0.70),
    (3, "Developing", "Moderate hallucination or bias detected — iterate prompts.",
     0.30, 0.30, 0.55),
    (2, "Emerging",   "Significant reliability gaps — tighten your prompts.",
     0.50, 0.50, 0.40),
    (1, "Novice",     "High hallucination or bias — review prompt strategy.",
     1.00, 1.00, 0.00),
]


def compute_maturity(metrics: SessionMetrics) -> dict:
    """
    Given a SessionMetrics object (rolling averages across all audits),
    return a dict with:
      - level: int (1–5)
      - label: str
      - tip: str
      - scores: { hallucination_pct, bias_pct, consistency_pct }
    """
    h = metrics.hallucination_rate   # 0.0–1.0 proportion
    b = metrics.bias_rate            # 0.0–1.0 proportion
    c = metrics.avg_confidence       # 0.0–1.0

    for level, label, tip, max_h, max_b, min_c in MATURITY_THRESHOLDS:
        if h <= max_h and b <= max_b and c >= min_c:
            return {
                "level": level,
                "label": label,
                "tip": tip,
                "scores": {
                    "hallucination_pct": round(h * 100),
                    "bias_pct": round(b * 100),
                    "consistency_pct": round(c * 100),
                },
            }

    # Fallback (should never be reached due to L1 catch-all)
    return {
        "level": 1,
        "label": "Novice",
        "tip": "High hallucination or bias — review prompt strategy.",
        "scores": {
            "hallucination_pct": round(h * 100),
            "bias_pct": round(b * 100),
            "consistency_pct": round(c * 100),
        },
    }
