import { Shield } from 'lucide-react';
import { cn } from '../lib/utils';
import { PromptAudit } from '../lib/api';

interface PreFlightReportProps {
  audit: PromptAudit;
  onApplyRewrite: (rewrite: string) => void;
}

export function PreFlightReport({ audit, onApplyRewrite }: PreFlightReportProps) {
  const getRiskColor = (tier: string) => {
    switch (tier) {
      case 'high': return 'text-red-400 border-red-500/30 bg-red-500/10';
      case 'medium': return 'text-orange-400 border-orange-500/30 bg-orange-500/10';
      default: return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-6 border-indigo-500/20">
      <h3 className="text-sm font-mono text-indigo-400 uppercase tracking-wider mb-4 flex items-center gap-2">
        <Shield className="w-4 h-4" /> Pre-Flight Analysis: 
        <span className={cn("px-2 py-0.5 rounded text-xs", getRiskColor(audit.risk_tier))}>
          {audit.risk_tier}
        </span>
      </h3>
      <p className="text-sm text-zinc-300 leading-relaxed mb-4">{audit.explanation}</p>
      
      {audit.suggested_rewrite && (
        <div className="bg-indigo-500/10 p-4 rounded-xl border border-indigo-500/20">
          <p className="text-xs font-bold text-indigo-400 mb-1">Suggested Rewrite:</p>
          <p className="text-sm text-white italic">"{audit.suggested_rewrite}"</p>
          <button 
            onClick={() => onApplyRewrite(audit.suggested_rewrite!)}
            className="mt-3 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded transition-colors"
          >
            Apply and Re-run
          </button>
        </div>
      )}
    </div>
  );
}
