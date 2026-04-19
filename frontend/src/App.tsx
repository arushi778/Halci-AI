/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, 
  History, 
  Trash2,
  ChevronRight,
  LayoutDashboard
} from 'lucide-react';
import { runTrustLensProxy, ProxyResponse } from './lib/api';
import { cn } from './lib/utils';

// Components
import { PromptInput } from './components/PromptInput';
import { PreFlightReport } from './components/PreFlightReport';
import { DiffView } from './components/DiffView';
import { MaturityBadge } from './components/MaturityBadge';
import { MetricsPanel } from './components/MetricsPanel';
import { ResponseRenderer } from './components/ResponseRenderer';

type ViewState = 'prompt' | 'audit' | 'history';

export default function App() {
  const [prompt, setPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const [result, setResult] = useState<ProxyResponse | null>(null);
  const [history, setHistory] = useState<ProxyResponse[]>([]);
  const [view, setView] = useState<ViewState>('prompt');

  // Load history
  useEffect(() => {
    const saved = localStorage.getItem('halsi_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse history', e);
      }
    }
  }, []);

  // Save history
  useEffect(() => {
    localStorage.setItem('halsi_history', JSON.stringify(history));
  }, [history]);

  const handleAudit = async () => {
    if (!prompt.trim()) return;
    setIsProcessing(true);
    try {
      const response = await runTrustLensProxy({
        prompt,
        use_rag: true,
        session_id: sessionId
      });
      setSessionId(response.session_id);
      setResult(response);
      setHistory(prev => [response, ...prev].slice(0, 20));
      setView('audit');
    } catch (error) {
      console.error('Audit failed', error);
      alert('TrustLens proxy failed. Ensure backend is running.');
    } finally {
      setIsProcessing(false);
    }
  };

  const startNewSession = () => {
    setPrompt('');
    setResult(null);
    setView('prompt');
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('halsi_history');
  };

  const handleApplyRewrite = (rewrite: string) => {
    setPrompt(rewrite);
    setView('prompt');
  };

  const handleIteratePrompt = () => {
    if (result) {
      setPrompt(result.audit.prompt);
    }
    setView('prompt');
  };

  const getRiskColor = (tier: string) => {
    switch (tier) {
      case 'high': return 'text-red-400 border-red-500/30 bg-red-500/10';
      case 'medium': return 'text-orange-400 border-orange-500/30 bg-orange-500/10';
      default: return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
    }
  };

  return (
    <div className="min-h-screen technical-grid flex flex-col text-zinc-100">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight">HALCI AI</h1>
              <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">TrustLens Integrity Framework</p>
            </div>
          </div>

          <nav className="flex items-center gap-1">
            <button 
              onClick={startNewSession}
              className={cn(
                "px-4 py-2 rounded-md text-sm font-medium transition-colors",
                view === 'prompt' || view === 'audit' ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white"
              )}
            >
              New Audit
            </button>
            <button 
              onClick={() => setView('history')}
              className={cn(
                "px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2",
                view === 'history' ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white"
              )}
            >
              <History className="w-4 h-4" />
              History
            </button>
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8">
        <AnimatePresence mode="wait">
          {/* Step 1: Prompt Input */}
          {view === 'prompt' && (
            <PromptInput 
              prompt={prompt} 
              setPrompt={setPrompt} 
              isProcessing={isProcessing} 
              handleAudit={handleAudit} 
            />
          )}

          {/* Step 2: Audit Dashboard */}
          {view === 'audit' && result && (
            <motion.div 
              key="audit"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <MaturityBadge level={result.audit.session_maturity} />

                {[
                  { label: 'Factuality', val: result.audit.overall_scores.factuality, color: 'text-emerald-400' },
                  { label: 'Bias (Inv)', val: result.audit.overall_scores.bias_inverse, color: 'text-indigo-400' },
                  { label: 'Consistency', val: result.audit.overall_scores.consistency, color: 'text-orange-400' },
                ].map((stat) => (
                  <div key={stat.label} className="glass-panel rounded-2xl p-4 flex flex-col items-center justify-center text-center space-y-1">
                    <p className="text-[10px] font-mono text-zinc-500 uppercase">{stat.label}</p>
                    <p className={cn("text-2xl font-bold", stat.color)}>{stat.val}%</p>
                  </div>
                ))}
              </div>

              {/* Pre-Flight Results */}
              <PreFlightReport 
                audit={result.audit.prompt_audit} 
                onApplyRewrite={handleApplyRewrite} 
              />

              {/* Diff Card (if iterating) */}
              {result.previous_audit && (
                <DiffView 
                  currentAudit={result.audit} 
                  previousAudit={result.previous_audit} 
                />
              )}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Sentence Audit List */}
                <ResponseRenderer sentences={result.audit.sentence_results} />

                {/* Sidebar */}
                <MetricsPanel 
                  audit={result.audit} 
                  alerts={result.alerts} 
                  onIterate={handleIteratePrompt} 
                />
              </div>
            </motion.div>
          )}

          {/* History View */}
          {view === 'history' && (
            <motion.div 
              key="history"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Audit History</h2>
                <button 
                  onClick={clearHistory}
                  className="flex items-center gap-2 text-sm text-zinc-500 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear All
                </button>
              </div>

              {history.length === 0 ? (
                <div className="glass-panel rounded-2xl p-12 text-center space-y-4">
                  <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto">
                    <History className="w-8 h-8 text-zinc-600" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-white font-bold">No audits yet</p>
                    <p className="text-zinc-500 text-sm">Run your first diagnostic to see it here.</p>
                  </div>
                  <button 
                    onClick={() => setView('prompt')}
                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-bold text-white transition-colors"
                  >
                    Start New Audit
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {history.map((item) => (
                    <button 
                      key={item.audit.id}
                      onClick={() => {
                        setResult(item);
                        setView('audit');
                      }}
                      className="glass-panel rounded-xl p-4 flex items-center justify-between hover:bg-zinc-800/50 transition-all text-left group"
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center",
                          item.audit.prompt_audit.risk_tier === 'high' ? "bg-red-500/20 text-red-400" : "bg-indigo-500/20 text-indigo-400"
                        )}>
                          <LayoutDashboard className="w-5 h-5" />
                        </div>
                        <div className="max-w-md">
                          <p className="text-sm font-bold text-white truncate">{item.audit.prompt}</p>
                          <p className="text-[10px] font-mono text-zinc-500 uppercase">
                            L{item.audit.session_maturity} Maturity
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="hidden md:flex items-center gap-4">
                          <div className="text-center">
                            <p className="text-[10px] font-mono text-zinc-500 uppercase">Fact</p>
                            <p className="text-xs font-bold text-emerald-400">{item.audit.overall_scores.factuality}%</p>
                          </div>
                          <div className="text-center">
                            <p className="text-[10px] font-mono text-zinc-500 uppercase">Risk</p>
                            <p className={cn("text-xs font-bold capitalize", getRiskColor(item.audit.prompt_audit.risk_tier).split(' ')[0])}>
                              {item.audit.prompt_audit.risk_tier}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-zinc-600 group-hover:text-white transition-colors" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="border-t border-zinc-800 py-8 bg-zinc-950/50">
        <div className="max-w-7xl mx-auto px-4 text-center space-y-4">
          <div className="flex items-center justify-center gap-2 text-zinc-500 text-xs font-mono uppercase tracking-widest">
            <Shield className="w-3 h-3" />
            Halci TrustLens™ Production Guard
          </div>
          <p className="text-zinc-600 text-[10px] max-w-xl mx-auto">
            Halci AI monitors model drift and integrity anomalies in real-time. 
            Audits are grounded in cross-referenced knowledge bases to ensure responsible AI deployment.
          </p>
        </div>
      </footer>
    </div>
  );
}
