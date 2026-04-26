import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { MaturityDetail } from '../lib/api';

interface MaturityBadgeProps {
  level: number;
  detail?: MaturityDetail;
}

const LEVEL_CONFIG = {
  5: { color: 'text-emerald-400', bar: 'bg-emerald-500', ring: 'border-emerald-500/40', glow: 'shadow-emerald-500/20' },
  4: { color: 'text-blue-400',    bar: 'bg-blue-500',    ring: 'border-blue-500/40',    glow: 'shadow-blue-500/20' },
  3: { color: 'text-indigo-400',  bar: 'bg-indigo-500',  ring: 'border-indigo-500/40',  glow: 'shadow-indigo-500/20' },
  2: { color: 'text-orange-400',  bar: 'bg-orange-500',  ring: 'border-orange-500/40',  glow: 'shadow-orange-500/20' },
  1: { color: 'text-red-400',     bar: 'bg-red-500',     ring: 'border-red-500/40',     glow: 'shadow-red-500/20' },
} as const;

export function MaturityBadge({ level, detail }: MaturityBadgeProps) {
  const cfg = LEVEL_CONFIG[level as keyof typeof LEVEL_CONFIG] ?? LEVEL_CONFIG[1];
  const label = detail?.label ?? `Level ${level}`;
  const tip   = detail?.tip;
  const scores = detail?.scores;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        'glass-panel rounded-2xl p-5 border flex flex-col gap-4',
        cfg.ring,
        `shadow-lg ${cfg.glow}`
      )}
    >
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Session Maturity</p>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className={cn('text-2xl font-black', cfg.color)}>L{level}</span>
            <span className={cn('text-sm font-bold', cfg.color)}>{label}</span>
          </div>
        </div>

        {/* Animated pip bars */}
        <div className="flex items-end gap-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <motion.div
              key={i}
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ delay: i * 0.07, type: 'spring', stiffness: 200 }}
              className={cn('w-2 rounded-sm', i <= level ? cfg.bar : 'bg-zinc-800')}
              style={{ height: `${8 + i * 4}px`, transformOrigin: 'bottom' }}
            />
          ))}
        </div>
      </div>

      {/* Score breakdown bars */}
      {scores && (
        <div className="space-y-2">
          {([
            { label: 'Hallucination', value: scores.hallucination_pct, invert: true  },
            { label: 'Bias',          value: scores.bias_pct,          invert: true  },
            { label: 'Consistency',   value: scores.consistency_pct,   invert: false },
          ] as const).map(({ label: l, value, invert }) => {
            const isGood   = invert ? value <= 20 : value >= 70;
            const isMid    = invert ? value <= 50 : value >= 40;
            const barColor = isGood ? 'bg-emerald-500' : isMid ? 'bg-orange-500' : 'bg-red-500';
            const fillPct  = invert ? 100 - value : value;

            return (
              <div key={l} className="space-y-0.5">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase">{l}</span>
                  <span className={cn('text-[11px] font-bold', isGood ? 'text-emerald-400' : isMid ? 'text-orange-400' : 'text-red-400')}>
                    {value}%
                  </span>
                </div>
                <div className="h-1 rounded-full bg-zinc-800 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${fillPct}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className={cn('h-full rounded-full', barColor)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Coaching tip */}
      {tip && (
        <p className="text-[10px] text-zinc-500 leading-snug border-t border-zinc-800 pt-3 italic">
          {tip}
        </p>
      )}
    </motion.div>
  );
}
