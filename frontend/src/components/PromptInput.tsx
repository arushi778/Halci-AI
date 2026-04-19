import { motion } from 'motion/react';
import { Search, Loader2 } from 'lucide-react';

interface PromptInputProps {
  prompt: string;
  setPrompt: (v: string) => void;
  isProcessing: boolean;
  handleAudit: () => void;
}

export function PromptInput({ prompt, setPrompt, isProcessing, handleAudit }: PromptInputProps) {
  return (
    <motion.div 
      key="prompt"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-3xl mx-auto space-y-8"
    >
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-[10px] font-mono text-indigo-400 uppercase tracking-wider mb-4">
          TrustLens Pipeline
        </div>
        <h2 className="text-3xl font-bold tracking-tight text-white">Full-Stack Generation</h2>
        <p className="text-zinc-400">Enter a prompt. TrustLens will score risks, generate grounded content, and audit sentences.</p>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <textarea 
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter the prompt you intend to send to the LLM..."
            className="w-full h-48 bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none placeholder:text-zinc-600 outline-none text-white"
          />
        </div>

        <button 
          onClick={handleAudit}
          disabled={isProcessing || !prompt.trim()}
          className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 disabled:text-zinc-500 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Auditing via TrustLens Proxy...
            </>
          ) : (
            <>
              <Search className="w-5 h-5" />
              Run TrustLens Proxy
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
}
