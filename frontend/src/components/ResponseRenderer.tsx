import { CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import { cn } from '../lib/utils';
import { SentenceResult } from '../lib/api';

interface ResponseRendererProps {
  sentences: SentenceResult[];
}

export function ResponseRenderer({ sentences }: ResponseRendererProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'unsupported': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'biased': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      default: return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    }
  };

  return (
    <div className="lg:col-span-2 space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-mono text-zinc-500 uppercase tracking-wider">Sentence-Level Audit</h3>
        <div className="flex gap-4">
          <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-bold uppercase">
            <div className="w-2 h-2 rounded-full bg-emerald-500" /> Grounded
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-orange-400 font-bold uppercase">
            <div className="w-2 h-2 rounded-full bg-orange-500" /> Biased
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-red-400 font-bold uppercase">
            <div className="w-2 h-2 rounded-full bg-red-500" /> Unsupported
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {sentences.map((audit_obj, idx) => (
          <div key={idx} className={cn("p-4 rounded-xl border transition-all", getStatusColor(audit_obj.status))}>
            <p className="text-sm text-white leading-relaxed mb-3">{audit_obj.text}</p>
            {audit_obj.source_excerpt && (
              <div className="mb-3 px-3 py-2 bg-black/20 rounded border border-white/10">
                <p className="text-[10px] text-zinc-400 mb-1">Source: {audit_obj.source_doc}</p>
                <p className="text-xs text-zinc-300 italic">...{audit_obj.source_excerpt}...</p>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t border-white/10">
              {(Object.entries(audit_obj.checks) as [string, { status: string; explanation: string }][]).map(([key, check]) => (
                <div key={key} className="space-y-1">
                  <p className="text-[9px] font-mono uppercase opacity-60">{key}</p>
                  <div className="flex items-start gap-1.5">
                    {check.status === 'pass' ? <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" /> : 
                     check.status === 'fail' ? <AlertTriangle className="w-3 h-3 text-red-400 shrink-0 mt-0.5" /> : 
                     <Info className="w-3 h-3 text-orange-400 shrink-0 mt-0.5" />}
                    <p className="text-[10px] leading-tight text-white/70">{check.explanation}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
