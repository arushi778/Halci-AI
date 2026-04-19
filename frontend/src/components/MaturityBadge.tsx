import { cn } from '../lib/utils';

interface MaturityBadgeProps {
  level: number;
}

export function MaturityBadge({ level }: MaturityBadgeProps) {
  return (
    <div className="glass-panel rounded-2xl p-4 flex flex-col items-center justify-center text-center space-y-1">
      <p className="text-[10px] font-mono text-zinc-500 uppercase">Session Maturity</p>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className={cn("w-2 h-6 rounded-sm", i <= level ? "bg-indigo-500" : "bg-zinc-800")} />
        ))}
        <span className="ml-2 text-xl font-bold text-white">L{level}</span>
      </div>
    </div>
  );
}
