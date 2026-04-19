import { motion } from 'motion/react';
import { RefreshCw, ArrowUpRight } from 'lucide-react';
import { cn } from '../lib/utils';
import { AuditRecord } from '../lib/api';

interface DiffViewProps {
  currentAudit: AuditRecord;
  previousAudit: AuditRecord;
}

export function DiffView({ currentAudit, previousAudit }: DiffViewProps) {
  return (
    <motion.div 
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      className="glass-panel rounded-2xl p-6 border-indigo-500/30 bg-indigo-500/5"
    >
      <div className="flex items-center gap-2 mb-4">
        <RefreshCw className="w-4 h-4 text-indigo-400" />
        <h3 className="text-sm font-bold text-white">Iteration Delta</h3>
      </div>
      <div className="grid grid-cols-3 gap-8">
        {[
          { label: 'Factuality', current: currentAudit.overall_scores.factuality, prev: previousAudit.overall_scores.factuality },
          { label: 'Bias (Inv)', current: currentAudit.overall_scores.bias_inverse, prev: previousAudit.overall_scores.bias_inverse },
          { label: 'Consistency', current: currentAudit.overall_scores.consistency, prev: previousAudit.overall_scores.consistency },
        ].map((delta) => {
           const diff = delta.current - delta.prev;
           const isImprovement = diff >= 0;
           if(diff === 0) return null;
           
           return (
             <div key={delta.label} className="space-y-1">
               <p className="text-[10px] font-mono text-zinc-500 uppercase">{delta.label}</p>
               <div className="flex items-center gap-2">
                 <span className="text-lg font-bold text-white">{delta.current}%</span>
                 <span className={cn(
                   "text-xs font-bold flex items-center",
                   isImprovement ? "text-emerald-400" : "text-red-400"
                 )}>
                   {diff > 0 ? '+' : ''}{diff}%
                   {isImprovement ? <ArrowUpRight className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3 rotate-90" />}
                 </span>
               </div>
             </div>
           );
        })}
      </div>
    </motion.div>
  );
}
