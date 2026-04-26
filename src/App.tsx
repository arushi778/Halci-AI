/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle2, 
  Search, 
  History, 
  BarChart3, 
  Zap, 
  Info,
  ArrowRight,
  Loader2,
  RefreshCw,
  Trash2,
  ChevronRight,
  LayoutDashboard,
  MessageSquare,
  FileText,
  Activity,
  ArrowUpRight,
  Sparkles,
  Layers
} from 'lucide-react';
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  ResponsiveContainer,
  Bar,
  BarChart,
  XAxis,
  YAxis,
  Tooltip
} from 'recharts';
import { performPreFlight, performFullAudit } from './lib/gemini';
import { generateWithProvider, ProviderId, PROVIDERS, isProviderConfigured, getProvider } from './lib/providers';
import { AnalysisResult, PreFlightAnalysis, SentenceAudit } from './types';
import { cn } from './lib/utils';
import ModelSelector from './components/ModelSelector';
import ReportPrintView from './components/ReportPrintView';

type ViewState = 'prompt' | 'preflight' | 'output' | 'audit' | 'history' | 'compare';

export interface CompareResult {
  provider: ProviderId;
  output: string;
  result?: AnalysisResult;
  error?: string;
}

export interface HistorySession {
  id: string;
  timestamp: number;
  prompt: string;
  type: 'single' | 'compare';
  singleResult?: AnalysisResult;
  compareResults?: CompareResult[];
  preFlight?: PreFlightAnalysis;
}

export default function App() {
  const [prompt, setPrompt] = useState('');
  const [output, setOutput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [preFlight, setPreFlight] = useState<PreFlightAnalysis | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [previousResult, setPreviousResult] = useState<AnalysisResult | null>(null);
  const [history, setHistory] = useState<HistorySession[]>(() => {
    const saved = localStorage.getItem('halsi_history');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse history', e);
      }
    }
    return [];
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [view, setView] = useState<ViewState>('prompt');
  // Multi-provider state
  const [selectedProvider, setSelectedProvider] = useState<ProviderId>('gemini');
  // Comparison state
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [compareResults, setCompareResults] = useState<CompareResult[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Save history
  useEffect(() => {
    localStorage.setItem('halsi_history', JSON.stringify(history));
  }, [history]);

  const handlePreFlight = async () => {
    if (!prompt.trim()) return;
    setIsProcessing(true);
    try {
      const analysis = await performPreFlight(prompt);
      setPreFlight(analysis);
      setView('preflight');
    } catch (error) {
      console.error('Pre-flight failed', error);
      alert('Pre-flight check failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFullAudit = async () => {
    if (!output.trim() || !preFlight) return;
    setIsProcessing(true);
    try {
      const audit = await performFullAudit(prompt, output, preFlight);
      if (result) setPreviousResult(result);
      setResult(audit);
      
      const newSession: HistorySession = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        prompt,
        type: 'single',
        singleResult: audit,
        preFlight
      };
      setHistory(prev => [newSession, ...prev].slice(0, 50));
      
      setView('audit');
    } catch (error) {
      console.error('Audit failed', error);
      alert('Audit failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGenerateWithProvider = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    try {
      const response = await generateWithProvider(prompt, selectedProvider);
      setOutput(response);
    } catch (error: any) {
      console.error('Generation failed', error);
      alert(`Generation failed: ${error?.message ?? 'Unknown error'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCompareModels = async () => {
    if (!prompt.trim() || !preFlight) return;
    setIsGenerating(true);
    try {
      const configuredProviders = PROVIDERS.filter(p => isProviderConfigured(p.id));
      if (configuredProviders.length < 2) {
        alert("Please configure at least 2 providers in .env.local to use comparison mode.");
        return;
      }
      
      const newCompareResults = await Promise.all(configuredProviders.map(async (p) => {
        try {
          const response = await generateWithProvider(prompt, p.id);
          const audit = await performFullAudit(prompt, response, preFlight);
          return { provider: p.id, output: response, result: audit };
        } catch (error: any) {
          return { provider: p.id, output: '', error: error?.message ?? 'Unknown error' };
        }
      }));
      setCompareResults(newCompareResults);
      
      const newSession: HistorySession = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        prompt,
        type: 'compare',
        compareResults: newCompareResults,
        preFlight
      };
      setHistory(prev => [newSession, ...prev].slice(0, 50));
      
      setView('compare');
    } catch (error: any) {
      console.error('Comparison failed', error);
      alert('Comparison failed.');
    } finally {
      setIsGenerating(false);
    }
  };

  const startNewSession = () => {
    setPrompt('');
    setOutput('');
    setPreFlight(null);
    setResult(null);
    setPreviousResult(null);
    setCompareResults([]);
    setView('prompt');
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  const loadHistorySession = (session: HistorySession) => {
    setPrompt(session.prompt);
    setPreFlight(session.preFlight || null);
    if (session.type === 'compare') {
      setCompareResults(session.compareResults || []);
      setView('compare');
    } else {
      setResult(session.singleResult || null);
      if (session.singleResult) setOutput(session.singleResult.output);
      setView('audit');
    }
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  const deleteHistorySession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setHistory(prev => prev.filter(s => s.id !== id));
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('halsi_history');
  };

  const getRiskColor = (tier: string) => {
    switch (tier) {
      case 'high': return 'text-red-400 border-red-500/30 bg-red-500/10';
      case 'medium': return 'text-orange-400 border-orange-500/30 bg-orange-500/10';
      default: return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'error': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'warning': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      default: return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    }
  };

  const filteredHistory = history.filter(s => s.prompt.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <>
    <div className="h-screen overflow-hidden technical-grid flex text-zinc-100 print:hidden">
      
      {/* ChatGPT-like Sidebar */}
      <aside className={cn(
        "flex-shrink-0 border-r border-zinc-800 bg-zinc-950 flex flex-col transition-all duration-300 z-40 absolute md:relative h-full",
        isSidebarOpen ? "w-72 translate-x-0" : "w-0 -translate-x-full md:translate-x-0 md:w-0 overflow-hidden border-none"
      )}>
        <div className="p-3">
          <button 
            onClick={startNewSession}
            className="w-full flex items-center gap-2 px-3 py-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-medium transition-colors"
          >
            <Shield className="w-5 h-5 text-indigo-400" />
            <span>New Audit</span>
            <Sparkles className="w-4 h-4 ml-auto text-zinc-400" />
          </button>
        </div>

        <div className="px-3 pb-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input 
              type="text" 
              placeholder="Search history..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-1">
          {filteredHistory.length === 0 ? (
            <p className="text-zinc-500 text-xs text-center mt-6">No history found</p>
          ) : (
            filteredHistory.map(session => (
              <div 
                key={session.id}
                onClick={() => loadHistorySession(session)}
                className="group relative flex items-center gap-3 p-3 rounded-lg hover:bg-zinc-800/50 cursor-pointer transition-colors"
              >
                {session.type === 'compare' ? (
                  <Layers className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                ) : (
                  <MessageSquare className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-zinc-300 truncate font-medium">{session.prompt}</p>
                  <p className="text-[10px] text-zinc-500 mt-0.5">
                    {new Date(session.timestamp).toLocaleDateString()} • {session.type === 'compare' ? 'Comparison' : 'Single Audit'}
                  </p>
                </div>
                <button 
                  onClick={(e) => deleteHistorySession(e, session.id)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-zinc-700 rounded text-zinc-400 hover:text-red-400 transition-all absolute right-2 bg-zinc-900/80 backdrop-blur-sm"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
      
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-10 flex-shrink-0">
        <div className="px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-zinc-800 rounded-md transition-colors"
            >
              <LayoutDashboard className="w-5 h-5 text-zinc-400 hover:text-white" />
            </button>
            <div className="flex items-center gap-2">
              <h1 className="font-bold tracking-tight">HALCI AI</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto w-full">
        <div className="max-w-7xl mx-auto p-4 md:p-8">
        <AnimatePresence mode="wait">
          {/* Step 1: Prompt Input */}
          {view === 'prompt' && (
            <motion.div 
              key="prompt"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-3xl mx-auto space-y-8"
            >
              <div className="text-center space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-[10px] font-mono text-indigo-400 uppercase tracking-wider mb-4">
                  Step 1: Pre-flight Analysis
                </div>
                <h2 className="text-3xl font-bold tracking-tight text-white">Analyze Your Prompt</h2>
                <p className="text-zinc-400">TrustLens scores your prompt across 4 axes before the LLM sees it.</p>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-mono text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                    <MessageSquare className="w-3 h-3 text-indigo-400" />
                    Input Prompt
                  </label>
                  <textarea 
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Enter the prompt you intend to send to the LLM..."
                    className="w-full h-48 bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none placeholder:text-zinc-600"
                  />
                </div>

                <button 
                  onClick={handlePreFlight}
                  disabled={isProcessing || !prompt.trim()}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 disabled:text-zinc-500 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Scoring Axes...
                    </>
                  ) : (
                    <>
                      <Search className="w-5 h-5" />
                      Run Pre-flight Diagnostic
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Pre-flight Results */}
          {view === 'preflight' && preFlight && (
            <motion.div 
              key="preflight"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-4xl mx-auto space-y-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Pre-flight Report</h2>
                <div className={cn("px-4 py-1 rounded-full border text-xs font-bold uppercase tracking-wider", getRiskColor(preFlight.riskTier))}>
                  {preFlight.riskTier} Risk Tier
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass-panel rounded-2xl p-6 space-y-6">
                  <h3 className="text-sm font-mono text-zinc-500 uppercase tracking-wider">Risk Axes</h3>
                  <div className="space-y-4">
                    {[
                      { label: 'Scope Ambiguity', score: preFlight.scores.scopeAmbiguity, desc: 'Vague prompts lead to hallucinations' },
                      { label: 'Leading Language', score: preFlight.scores.leadingLanguage, desc: 'Steering the model toward bias' },
                      { label: 'Demographic Triggers', score: preFlight.scores.demographicTriggers, desc: 'Risk for differential sentiment' },
                      { label: 'Injection Patterns', score: preFlight.scores.injectionPatterns, desc: 'Safety instruction override attempts' },
                    ].map((axis) => (
                      <div key={axis.label} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-zinc-300 font-medium">{axis.label}</span>
                          <span className={cn("font-mono", axis.score > 50 ? "text-orange-400" : "text-emerald-400")}>{axis.score}%</span>
                        </div>
                        <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${axis.score}%` }}
                            className={cn("h-full rounded-full", axis.score > 50 ? "bg-orange-500" : "bg-emerald-500")}
                          />
                        </div>
                        <p className="text-[10px] text-zinc-500 italic">{axis.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="glass-panel rounded-2xl p-6 border-indigo-500/20">
                    <h3 className="text-sm font-mono text-zinc-500 uppercase tracking-wider mb-4">Analysis</h3>
                    <p className="text-sm text-zinc-300 leading-relaxed">{preFlight.explanation}</p>
                  </div>

                  {preFlight.suggestedRewrite && (
                    <div className="glass-panel rounded-2xl p-6 bg-indigo-500/5 border-indigo-500/30">
                      <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="w-4 h-4 text-indigo-400" />
                        <h3 className="text-sm font-bold text-white">Suggested Rewrite</h3>
                      </div>
                      <p className="text-sm text-indigo-200 italic mb-4">"{preFlight.suggestedRewrite}"</p>
                      <button 
                        onClick={() => {
                          setPrompt(preFlight.suggestedRewrite!);
                          setView('prompt');
                        }}
                        className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
                      >
                        Apply this rewrite <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-center pt-4">
                <button 
                  onClick={() => setView('output')}
                  className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold text-white transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/20"
                >
                  Proceed to LLM Generation <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Output Input */}
          {view === 'output' && (
            <motion.div 
              key="output"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-3xl mx-auto space-y-8"
            >
              <div className="text-center space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[10px] font-mono text-emerald-400 uppercase tracking-wider mb-4">
                  Step 2: LLM Response Audit
                </div>
                <h2 className="text-3xl font-bold tracking-tight text-white">Model Response</h2>
                <p className="text-zinc-400">Choose a provider and model to generate, or paste your own LLM output.</p>
              </div>

              <div className="space-y-6">
                {/* Option 1: Generate with AI */}
                <div className="glass-panel rounded-2xl p-6 border-indigo-500/20 bg-indigo-500/5 space-y-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    <h3 className="text-sm font-bold text-white">Generate with AI</h3>
                    <span className="ml-auto text-[10px] font-mono text-zinc-500 uppercase">3 providers available</span>
                  </div>

                  {/* Model Selector */}
                  <div className={cn("transition-all duration-300", isCompareMode ? "opacity-50 pointer-events-none" : "opacity-100")}>
                    <ModelSelector
                      selectedProvider={selectedProvider}
                      onProviderChange={setSelectedProvider}
                    />
                  </div>

                  {/* Compare Toggle */}
                  <div className="flex items-center gap-2 py-2">
                    <input 
                      type="checkbox" 
                      id="compare-mode" 
                      checked={isCompareMode} 
                      onChange={(e) => setIsCompareMode(e.target.checked)} 
                      className="w-4 h-4 bg-zinc-900 border-zinc-700 rounded text-indigo-600 focus:ring-indigo-500 focus:ring-offset-zinc-900"
                    />
                    <label htmlFor="compare-mode" className="text-sm text-zinc-300 cursor-pointer select-none">
                      Enable Model Comparison Mode
                    </label>
                  </div>

                  {/* Prompt preview */}
                  <div className="bg-zinc-900/60 rounded-lg p-3 border border-zinc-800">
                    <p className="text-[10px] font-mono text-zinc-500 uppercase mb-1">Your Prompt</p>
                    <p className="text-sm text-zinc-300 line-clamp-3">{prompt}</p>
                  </div>

                  <button
                    id="generate-with-ai-btn"
                    onClick={isCompareMode ? handleCompareModels : handleGenerateWithProvider}
                    disabled={isGenerating || isProcessing}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 disabled:text-zinc-500 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        {isCompareMode ? "Comparing Models..." : "Generating Response..."}
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        {isCompareMode ? "Compare Configured Models" : "Generate Response"}
                      </>
                    )}
                  </button>
                </div>

                {/* Divider */}
                <div className="flex items-center gap-4">
                  <div className="flex-1 h-px bg-zinc-800" />
                  <span className="text-xs font-mono text-zinc-500 uppercase tracking-wider">or paste your own</span>
                  <div className="flex-1 h-px bg-zinc-800" />
                </div>

                {/* Option 2: Paste manually */}
                <div className="space-y-2">
                  <label className="text-xs font-mono text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                    <FileText className="w-3 h-3 text-emerald-400" />
                    LLM Output
                  </label>
                  <textarea
                    value={output}
                    onChange={(e) => setOutput(e.target.value)}
                    placeholder="Paste the generated response here..."
                    className="w-full h-48 bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all resize-none placeholder:text-zinc-600"
                  />
                </div>

                <button
                  onClick={handleFullAudit}
                  disabled={isProcessing || !output.trim()}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-500 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Auditing Sentences...
                    </>
                  ) : (
                    <>
                      <Activity className="w-5 h-5" />
                      Run Full Integrity Audit
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 4: Audit Dashboard */}
          {view === 'audit' && result && (
            <motion.div 
              key="audit"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-white">Integrity Audit Dashboard</h2>
                  <p className="text-sm text-zinc-400">Detailed sentence-level analysis of the LLM response</p>
                </div>
                <button 
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-bold text-white transition-colors flex items-center gap-2 shadow-lg shadow-indigo-600/20"
                >
                  <FileText className="w-4 h-4" /> Print / Save as PDF
                </button>
              </div>

              {/* Top Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="glass-panel rounded-2xl p-4 flex flex-col items-center justify-center text-center space-y-1">
                  <p className="text-[10px] font-mono text-zinc-500 uppercase">Session Maturity</p>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className={cn("w-2 h-6 rounded-sm", i <= result.sessionMaturity ? "bg-indigo-500" : "bg-zinc-800")} />
                    ))}
                    <span className="ml-2 text-xl font-bold text-white">L{result.sessionMaturity}</span>
                  </div>
                </div>

                {[
                  { label: 'Factuality', val: result.overallScores.factuality, color: 'text-emerald-400' },
                  { label: 'Bias (Inv)', val: 100 - result.overallScores.bias, color: 'text-indigo-400' },
                  { label: 'Consistency', val: result.overallScores.consistency, color: 'text-orange-400' },
                ].map((stat) => (
                  <div key={stat.label} className="glass-panel rounded-2xl p-4 flex flex-col items-center justify-center text-center space-y-1">
                    <p className="text-[10px] font-mono text-zinc-500 uppercase">{stat.label}</p>
                    <p className={cn("text-2xl font-bold", stat.color)}>{stat.val}%</p>
                  </div>
                ))}
              </div>

              {/* Diff Card (if iterating) */}
              {previousResult && (
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
                      { label: 'Factuality', current: result.overallScores.factuality, prev: previousResult.overallScores.factuality },
                      { label: 'Bias', current: result.overallScores.bias, prev: previousResult.overallScores.bias },
                      { label: 'Consistency', current: result.overallScores.consistency, prev: previousResult.overallScores.consistency },
                    ].map((delta) => {
                      const diff = delta.current - delta.prev;
                      const isImprovement = delta.label === 'Bias' ? diff < 0 : diff > 0;
                      return (
                        <div key={delta.label} className="space-y-1">
                          <p className="text-[10px] font-mono text-zinc-500 uppercase">{delta.label}</p>
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-white">{delta.current}%</span>
                            <span className={cn(
                              "text-xs font-bold flex items-center",
                              diff === 0 ? "text-zinc-500" : isImprovement ? "text-emerald-400" : "text-red-400"
                            )}>
                              {diff > 0 ? '+' : ''}{diff}%
                              {diff !== 0 && (isImprovement ? <ArrowUpRight className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3 rotate-90" />)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Sentence Audit List */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-mono text-zinc-500 uppercase tracking-wider">Sentence-Level Audit</h3>
                    <div className="flex gap-4">
                      <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-bold uppercase">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" /> Grounded
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-orange-400 font-bold uppercase">
                        <div className="w-2 h-2 rounded-full bg-orange-500" /> Potential Bias
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-red-400 font-bold uppercase">
                        <div className="w-2 h-2 rounded-full bg-red-500" /> Unsupported
                      </div>
                    </div>
                  </div>

                    <div className="space-y-3">
                    {result.sentenceAudits.map((audit, idx) => (
                      <div key={idx} className={cn("p-4 rounded-xl border transition-all", getStatusColor(audit.status))}>
                        <p className="text-sm text-white leading-relaxed mb-3">{audit.text}</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t border-white/10">
                          {(Object.entries(audit.checks) as [string, { status: string; explanation: string }][]).map(([key, check]) => (
                            <div key={key} className="space-y-1">
                              <p className="text-[9px] font-mono uppercase opacity-60">{key}</p>
                              <div className="flex items-start gap-1.5">
                                {check.status === 'pass' ? <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" /> : 
                                 check.status === 'fail' ? <AlertTriangle className="w-3 h-3 text-red-400 shrink-0 mt-0.5" /> : 
                                 <Info className="w-3 h-3 text-orange-400 shrink-0 mt-0.5" />}
                                <p className="text-[10px] leading-tight text-zinc-300">{check.explanation}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sidebar Stats */}
                <div className="space-y-6">
                  <div className="glass-panel rounded-2xl p-6">
                    <h3 className="text-sm font-mono text-zinc-500 uppercase tracking-wider mb-4">Integrity Radar</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={[
                          { subject: 'Factuality', value: result.overallScores.factuality },
                          { subject: 'Bias (Inv)', value: 100 - result.overallScores.bias },
                          { subject: 'Safety', value: result.overallScores.safety },
                          { subject: 'Consistency', value: result.overallScores.consistency },
                        ]}>
                          <PolarGrid stroke="#333" />
                          <PolarAngleAxis dataKey="subject" tick={{ fill: '#888', fontSize: 10 }} />
                          <Radar name="Audit" dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.5} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="glass-panel rounded-2xl p-6 space-y-4">
                    <h3 className="text-sm font-mono text-zinc-500 uppercase tracking-wider">Overall Verdict</h3>
                    <p className="text-sm text-zinc-300 leading-relaxed">{result.overallVerdict}</p>
                    <div className="pt-4">
                      <button 
                        onClick={() => setView('prompt')}
                        className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-sm font-bold text-white transition-colors flex items-center justify-center gap-2"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Iterate Prompt
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
          {/* Compare View */}
          {view === 'compare' && compareResults && (
            <motion.div 
              key="compare"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">Model Comparison</h2>
                  <p className="text-sm text-zinc-400">Comparing outputs and integrity scores across configured providers</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button 
                    onClick={handleCompareModels}
                    disabled={isGenerating}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm font-bold text-white transition-colors flex items-center gap-2 shadow-lg disabled:opacity-50"
                  >
                    <RefreshCw className={cn("w-4 h-4", isGenerating && "animate-spin")} /> Run Again
                  </button>
                  <button 
                    onClick={() => window.print()}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-bold text-white transition-colors flex items-center gap-2 shadow-lg shadow-indigo-600/20"
                  >
                    <FileText className="w-4 h-4" /> Print / Save as PDF
                  </button>
                  <button 
                    onClick={() => setView('prompt')}
                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm font-bold text-white transition-colors flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" /> New Audit
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {compareResults.map((cr) => {
                  const providerInfo = getProvider(cr.provider);
                  return (
                    <div key={cr.provider} className="glass-panel rounded-2xl p-6 space-y-4 flex flex-col">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">{providerInfo.icon}</span>
                        <h3 className={cn("text-lg font-bold", providerInfo.color)}>{providerInfo.name}</h3>
                      </div>
                      
                      {cr.error ? (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400 text-sm flex-1 flex items-center justify-center text-center">
                          Error: {cr.error}
                        </div>
                      ) : cr.result ? (
                        <>
                          <div className="space-y-4 flex-1">
                            {/* Output preview */}
                            <div className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-800/50 h-48 overflow-y-auto">
                              <p className="text-[10px] font-mono text-zinc-500 uppercase mb-2">Response Preview</p>
                              <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap">{cr.output}</p>
                            </div>
                            
                            {/* Scores */}
                            <div className="grid grid-cols-2 gap-2">
                               {[
                                { label: 'Factuality', val: cr.result.overallScores.factuality, color: 'text-emerald-400' },
                                { label: 'Bias (Inv)', val: 100 - cr.result.overallScores.bias, color: 'text-indigo-400' },
                                { label: 'Safety', val: cr.result.overallScores.safety, color: 'text-blue-400' },
                                { label: 'Consistency', val: cr.result.overallScores.consistency, color: 'text-orange-400' },
                              ].map((stat) => (
                                <div key={stat.label} className="bg-zinc-900/30 rounded-lg p-2 text-center border border-zinc-800/30">
                                  <p className="text-[9px] font-mono text-zinc-500 uppercase">{stat.label}</p>
                                  <p className={cn("text-lg font-bold", stat.color)}>{stat.val}%</p>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          <button
                            onClick={() => {
  setResult(cr.result!);
  setOutput(cr.output);
  setView('audit');
}}
                            className={cn(
                              "w-full py-3 rounded-xl text-sm font-bold text-white transition-all mt-4 border",
                              providerInfo.bgColor, providerInfo.borderColor, "hover:opacity-80 flex items-center justify-center gap-2"
                            )}
                          >
                            <BarChart3 className="w-4 h-4" /> View Full Audit
                          </button>
                        </>
                      ) : (
                        <div className="flex items-center justify-center h-full text-zinc-500 text-sm">
                          <Loader2 className="w-5 h-5 animate-spin" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        </div>
      </main>

      <footer className="py-4 flex-shrink-0">
        <div className="text-center">
          <p className="text-[10px] text-zinc-500 flex items-center justify-center gap-1.5">
            <Shield className="w-3 h-3 text-zinc-600" />
            Halci AI can make mistakes. Please verify important information.
          </p>
        </div>
      </footer>
      </div>
    </div>
    
    {/* Hidden Print View */}
    {(view === 'compare' || view === 'audit') && (
      <ReportPrintView 
        prompt={prompt} 
        compareResults={view === 'compare' ? compareResults : [{ provider: selectedProvider, output: output, result: result! }]} 
      />
    )}
    </>
  );
}
