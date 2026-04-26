import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertTriangle, Info, BookOpen } from 'lucide-react';
import { cn } from '../lib/utils';
import { SentenceResult } from '../lib/api';

interface SentenceTooltipProps {
  audit: SentenceResult;
}

export function SentenceTooltip({ audit }: SentenceTooltipProps) {
  const [isHovered, setIsHovered] = useState(false);

  const getHighlightColor = (status: string) => {
    switch (status) {
      case 'unsupported': return 'bg-red-500/20 text-red-100 hover:bg-red-500/40 border-red-500/30 border-b-2 cursor-help';
      case 'biased': return 'bg-orange-500/20 text-orange-100 hover:bg-orange-500/40 border-orange-500/30 border-b-2 cursor-help';
      default: return 'text-zinc-300 hover:bg-emerald-500/10 hover:text-emerald-300 transition-colors cursor-default';
    }
  };

  const getStatusBorder = (status: string) => {
    switch (status) {
      case 'unsupported': return 'border-red-500/50 shadow-red-500/20';
      case 'biased': return 'border-orange-500/50 shadow-orange-500/20';
      default: return 'border-emerald-500/50 shadow-emerald-500/20';
    }
  };

  // Only show tooltip if there's an actual flag or it's grounded with source
  const hasInteractiveData = audit.status !== 'grounded' || audit.source_doc;

  return (
    <span 
      className="relative inline-block"
      onMouseEnter={() => hasInteractiveData && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <span className={cn("px-1 py-0.5 rounded-sm transition-colors", getHighlightColor(audit.status))}>
        {audit.text}{' '}
      </span>

      <AnimatePresence>
        {isHovered && hasInteractiveData && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={cn(
              "absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-3 w-80 p-4 rounded-xl backdrop-blur-xl bg-zinc-950/95 border shadow-2xl",
              getStatusBorder(audit.status)
            )}
          >
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className={cn(
                  "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                  audit.status === 'unsupported' ? "bg-red-500/20 text-red-400" :
                  audit.status === 'biased' ? "bg-orange-500/20 text-orange-400" :
                  "bg-emerald-500/20 text-emerald-400"
                )}>
                  {audit.status}
                </span>
                <span className="text-[10px] text-zinc-500 font-mono tracking-wider">LITERACY CARD</span>
              </div>

              {audit.source_excerpt && (
                <div className="bg-zinc-900/50 p-2.5 rounded-lg border border-zinc-800">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase flex items-center gap-1.5 mb-1">
                    <BookOpen className="w-3 h-3" /> {audit.source_doc}
                  </p>
                  <p className="text-xs text-zinc-300 italic leading-snug break-words whitespace-normal font-serif">
                    "{audit.source_excerpt}"
                  </p>
                </div>
              )}

              <div className="space-y-2.5 pt-1">
                {(Object.entries(audit.checks) as [string, { status: string; explanation: string }][]).map(([key, check]) => (
                  <div key={key} className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      {check.status === 'pass' ? <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" /> : 
                       check.status === 'fail' ? <AlertTriangle className="w-3 h-3 text-red-400 shrink-0" /> : 
                       <Info className="w-3 h-3 text-orange-400 shrink-0" />}
                      <span className="text-[9px] font-mono text-zinc-400 uppercase">{key}</span>
                    </div>
                    <p className="text-[11px] leading-snug text-zinc-300 pl-4 break-words whitespace-normal">
                      {check.explanation}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Arrow pointer */}
            <div className={cn(
              "absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 rotate-45 border-r border-b bg-zinc-950",
              audit.status === 'unsupported' ? "border-red-500/50" :
              audit.status === 'biased' ? "border-orange-500/50" :
              "border-emerald-500/50"
            )} />
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  );
}
