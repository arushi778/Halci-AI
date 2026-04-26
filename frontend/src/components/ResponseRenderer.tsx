import { SentenceResult } from '../lib/api';
import { SentenceTooltip } from './SentenceTooltip';

interface ResponseRendererProps {
  sentences: SentenceResult[];
}

export function ResponseRenderer({ sentences }: ResponseRendererProps) {
  return (
    <div className="lg:col-span-2 space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-mono text-zinc-500 uppercase tracking-wider">AI Synthesis & Audit Flags</h3>
        <div className="flex gap-4">
          <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 font-bold uppercase">
            <div className="w-2 h-2 rounded-full bg-emerald-500/20" /> Grounded
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-orange-400 font-bold uppercase">
            <div className="w-2 h-2 rounded-full border-b-2 border-orange-500/50 bg-orange-500/20" /> Biased
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-red-400 font-bold uppercase">
            <div className="w-2 h-2 rounded-full border-b-2 border-red-500/50 bg-red-500/20" /> Unsupported
          </div>
        </div>
      </div>

      <div className="p-6 glass-panel rounded-2xl text-base leading-loose font-serif">
        {sentences.map((audit_obj, idx) => (
          <SentenceTooltip key={idx} audit={audit_obj} />
        ))}
      </div>
    </div>
  );
}
