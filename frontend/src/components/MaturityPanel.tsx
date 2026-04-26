import { motion } from 'motion/react';
import { CheckCircle2, Star } from 'lucide-react';
import { cn } from '../lib/utils';
import { MaturityDetail } from '../lib/api';

interface MaturityPanelProps {
  level: number;
  detail?: MaturityDetail;
  overallScores?: {
    factuality: number;
    bias_inverse: number;
    consistency: number;
  };
}

const LEVELS = [
  {
    id: 1,
    label: 'Novice',
    desc: 'Frequent hallucinations, unverified claims',
  },
  {
    id: 2,
    label: 'Developing',
    desc: 'Factual queries reliable, open-ended weak',
  },
  {
    id: 3,
    label: 'Proficient',
    desc: 'Scoped prompts, source anchoring applied',
  },
  {
    id: 4,
    label: 'Advanced',
    desc: 'Bias-aware, consistent multi-turn outputs',
  },
  {
    id: 5,
    label: 'Expert',
    desc: 'Fully grounded, zero bias, production-ready',
  },
] as const;

const CRITERIA: { [key: number]: string[] } = {
  2: [
    'Hallucination score below 0.50 across session',
    'At least one factual claim verified via RAG',
  ],
  3: [
    'Hallucination score below 0.30 across session',
    'Bias delta within acceptable range',
    'Consistency score above 0.55',
  ],
  4: [
    'Hallucination score below 0.15 across session',
    'Bias delta under threshold on all flagged sentences',
    'Consistency score above 0.70 across all responses',
    'No high-risk prompts in the session',
  ],
  5: [
    'Hallucination score below 0.05 across session',
    'Bias delta under threshold on all flagged sentences',
    'Consistency score above 0.85 across all responses',
    'Zero high-risk prompts in the session',
    'Re-evaluation used at least once to improve output',
    'RAG grounding verified on all factual claims',
  ],
};

const FULL_DESCRIPTIONS: { [key: number]: string } = {
  1: 'High hallucination risk — significant prompt refinement needed',
  2: 'Emerging reliability — factual grounding improving',
  3: 'Moderate integrity — most claims anchored to sources',
  4: 'Strong trust signals — bias-aware and consistent outputs',
  5: 'AI-literate practitioner — consistently grounded, unbiased, coherent outputs',
};

export function MaturityPanel({ level, detail, overallScores }: MaturityPanelProps) {
  const currentLevelInfo = LEVELS.find((l) => l.id === level) ?? LEVELS[0];
  const criteria = CRITERIA[level] ?? CRITERIA[2];

  const halPct   = detail?.scores.hallucination_pct ?? 0;
  const biasPct  = detail?.scores.bias_pct ?? 0;
  const consPct  = detail?.scores.consistency_pct ?? overallScores?.consistency ?? 0;
  const sessionScore = Math.round((
    (overallScores?.factuality ?? 0) +
    (overallScores?.bias_inverse ?? 0) +
    consPct
  ) / 3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full space-y-3"
    >
      <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Session Maturity</p>

      {/* ── Hero card ───────────────────────────────────────────── */}
      <div className="glass-panel rounded-2xl p-5 border border-indigo-500/30 flex items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 shrink-0">
            <span className="text-2xl font-black text-white">L{level}</span>
          </div>
          <div>
            <p className="text-[10px] font-mono text-indigo-400 uppercase tracking-wider">Current Level</p>
            <h3 className="text-lg font-bold text-white mt-0.5">
              {currentLevelInfo.label} — {FULL_DESCRIPTIONS[level]}
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5 font-mono">{currentLevelInfo.desc}</p>
          </div>
        </div>

        <div className="text-right shrink-0">
          <p className="text-4xl font-black text-indigo-400">{sessionScore}</p>
          <p className="text-[10px] font-mono text-zinc-500 uppercase mt-0.5">Session Score</p>
          <div className="flex items-center gap-1 mt-1.5 justify-end">
            <div className="h-1.5 w-16 rounded-full bg-indigo-600 overflow-hidden">
              <div
                className="h-full bg-indigo-400 rounded-full"
                style={{ width: `${(level / 5) * 100}%` }}
              />
            </div>
            {level === 5 && <span className="text-[9px] text-zinc-500 font-mono">Max level</span>}
          </div>
        </div>
      </div>

      {/* ── Level progression cards ──────────────────────────────── */}
      <div className="grid grid-cols-5 gap-3">
        {LEVELS.map((lvl) => {
          const isCompleted = lvl.id < level;
          const isCurrent   = lvl.id === level;

          return (
            <div
              key={lvl.id}
              className={cn(
                'rounded-xl p-3 border transition-all',
                isCurrent
                  ? 'border-indigo-500/50 bg-indigo-500/10'
                  : isCompleted
                  ? 'border-zinc-700/50 bg-zinc-900/50'
                  : 'border-zinc-800/50 bg-zinc-900/30 opacity-50'
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={cn('text-xs font-bold font-mono', isCurrent ? 'text-indigo-400' : 'text-zinc-400')}>
                  L{lvl.id}
                </span>
                {isCurrent ? (
                  <Star className="w-3.5 h-3.5 text-indigo-400 fill-indigo-400" />
                ) : isCompleted ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : null}
              </div>
              <p className={cn('text-sm font-bold', isCurrent ? 'text-white' : 'text-zinc-300')}>{lvl.label}</p>
              <p className="text-[10px] text-zinc-500 mt-1 leading-snug font-mono">{lvl.desc}</p>
              <div className="mt-3">
                <span className={cn(
                  'text-[9px] font-bold px-1.5 py-0.5 rounded font-mono uppercase tracking-wide',
                  isCurrent
                    ? 'bg-indigo-500/20 text-indigo-400'
                    : isCompleted
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-zinc-800 text-zinc-600'
                )}>
                  {isCurrent ? 'Current' : isCompleted ? 'Completed' : 'Locked'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Level criteria ───────────────────────────────────────── */}
      <div className="glass-panel rounded-2xl p-5 border border-zinc-800">
        <p className="text-[10px] font-mono text-indigo-400 uppercase tracking-wider mb-3">
          Level Criteria — What L{level} Requires
        </p>
        <div className="grid grid-cols-2 gap-2">
          {criteria.map((c, i) => (
            <div key={i} className="flex items-start gap-2 p-2.5 bg-zinc-900/60 rounded-lg">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
              <span className="text-xs text-zinc-300 font-mono leading-snug">{c}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Bottom metric strip ──────────────────────────────────── */}
      <div className="grid grid-cols-3 divide-x divide-zinc-800 glass-panel rounded-2xl overflow-hidden border border-zinc-800">
        {[
          { label: 'Avg Hallucination', value: (halPct / 100).toFixed(2), good: halPct <= 20 },
          { label: 'Avg Bias Score',    value: (biasPct / 100).toFixed(2), good: biasPct <= 20 },
          { label: 'Avg Consistency',   value: (consPct / 100).toFixed(2), good: consPct >= 70 },
        ].map(({ label, value, good }) => (
          <div key={label} className="flex flex-col items-center py-4">
            <span className={cn('text-2xl font-black font-mono', good ? 'text-emerald-400' : 'text-orange-400')}>
              {value}
            </span>
            <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider mt-1">{label}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
