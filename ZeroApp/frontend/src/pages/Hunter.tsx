import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../components/theme-provider';
import { triggerHunt, HuntResponse, PreyItem } from '../services/huntService';
import { analyzeTrends, learnMethods, writeScript, TrendReport, WritingMethod } from '../services/agentService';
import { Search, Terminal, Flame, Database, ArrowRight, Loader2, AlertCircle, Brain, FileText, Sparkles, PenTool } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function Hunter() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [topic, setTopic] = useState('');
  const [isHunting, setIsHunting] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [results, setResults] = useState<HuntResponse | null>(null);
  
  // Agent State
  const [viewMode, setViewMode] = useState<'hunt' | 'agent'>('hunt');
  const [agentState, setAgentState] = useState<'idle' | 'analyzing' | 'learning' | 'drafting' | 'done'>('idle');
  const [trendReport, setTrendReport] = useState<TrendReport | null>(null);
  const [writingMethod, setWritingMethod] = useState<WritingMethod | null>(null);
  const [draftScript, setDraftScript] = useState<string | null>(null);

  const terminalEndRef = useRef<HTMLDivElement>(null);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const handleHunt = async () => {
    if (!topic.trim()) return;

    setIsHunting(true);
    setLogs([]);
    setResults(null);
    setViewMode('hunt');
    setAgentState('idle');
    setTrendReport(null);
    setWritingMethod(null);
    setDraftScript(null);
    
    addLog(`INITIALIZING HUNTER PROTOCOL...`);
    addLog(`TARGET LOCKED: "${topic}"`);
    
    try {
      // Simulate some "hacking" delay steps for effect
      await new Promise(r => setTimeout(r, 800));
      addLog(`CONNECTING TO TAVILY NEURAL NET...`);
      
      await new Promise(r => setTimeout(r, 1000));
      addLog(`SCANNING GLOBAL DATA STREAMS...`);

      const data = await triggerHunt(topic);
      
      addLog(`SCAN COMPLETE. FOUND ${data.prey.length} PREY ITEMS.`);
      addLog(`BEGINNING ENTROPY ANALYSIS...`);
      
      await new Promise(r => setTimeout(r, 600));
      addLog(`INGESTION SEQUENCE STARTED.`);
      
      setResults(data);
      addLog(`PROTOCOL FINISHED. ENGINE UPDATED.`);
    } catch (error) {
      addLog(`ERROR: CONNECTION SEVERED. ${error}`);
    } finally {
      setIsHunting(false);
    }
  };

  const handleProcess = async () => {
    if (!results?.prey) return;
    setViewMode('agent');
    setAgentState('analyzing');
    addLog('INITIATING AGENT PROTOCOL...');

    try {
        // 1. Analyze
        await new Promise(r => setTimeout(r, 1000)); // Mock delay for visual
        addLog('AGENT: ANALYZING TRENDS...');
        const report = await analyzeTrends(results.prey);
        setTrendReport(report);
        addLog(`AGENT: TREND IDENTIFIED: ${report.topic}`);

        // 2. Learn
        setAgentState('learning');
        await new Promise(r => setTimeout(r, 1000));
        addLog('AGENT: EXTRACTING METHODOLOGIES...');
        const methods = await learnMethods(results.prey);
        const method = methods[0]; // Pick first for now
        setWritingMethod(method);
        addLog(`AGENT: METHODOLOGY LOCKED: ${method.method_name}`);

        // 3. Write
        setAgentState('drafting');
        await new Promise(r => setTimeout(r, 1500));
        addLog('AGENT: DRAFTING SCRIPT...');
        const { script } = await writeScript(report, method);
        setDraftScript(script);
        setAgentState('done');
        addLog('AGENT: SCRIPT GENERATED SUCCESSFULLY.');

    } catch (e) {
        addLog(`AGENT ERROR: ${e}`);
        setAgentState('idle'); // or error
    }
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Header Area */}
      <div className="flex items-end justify-between border-b border-zero-border pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <Flame className="text-zero-accent" />
            HUNTER PROTOCOL
          </h1>
          <p className="text-muted-foreground mt-1 font-mono text-sm">
            /usr/bin/zero_agent --mode={viewMode}
          </p>
        </div>
        <div className="flex gap-4 text-xs font-mono">
          <div className="flex items-center gap-2 px-3 py-1 rounded bg-zero-card border border-zero-border">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            NET: CONNECTED
          </div>
          <div className="flex items-center gap-2 px-3 py-1 rounded bg-zero-card border border-zero-border">
            <span className={`w-2 h-2 rounded-full ${isHunting || agentState !== 'idle' && agentState !== 'done' ? 'bg-zero-accent animate-ping' : 'bg-muted'}`} />
            STATUS: {isHunting ? 'HUNTING' : agentState !== 'idle' && agentState !== 'done' ? `AGENT:${agentState.toUpperCase()}` : 'IDLE'}
          </div>
        </div>
      </div>

      {/* Input Section */}
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="text-muted-foreground group-focus-within:text-zero-primary transition-colors" />
        </div>
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleHunt()}
          placeholder="Enter prey keywords (e.g. 'Latest AI Trends', 'Cyberpunk Aesthetics')..."
          className="w-full bg-zero-card border border-zero-border rounded-xl py-4 pl-12 pr-32 text-lg focus:outline-none focus:border-zero-primary focus:ring-1 focus:ring-zero-primary transition-all shadow-lg placeholder:text-muted"
          disabled={isHunting || (agentState !== 'idle' && agentState !== 'done')}
        />
        <div className="absolute right-2 top-2 bottom-2 flex gap-2">
            {results && viewMode === 'hunt' && (
                <button
                    onClick={handleProcess}
                    className="px-6 bg-zero-secondary hover:bg-zero-secondary/90 text-white rounded-lg font-bold tracking-wide transition-all flex items-center gap-2 animate-in fade-in"
                >
                    <Brain size={18} />
                    PROCESS PREY
                </button>
            )}
            <button
            onClick={handleHunt}
            disabled={isHunting || !topic.trim() || (agentState !== 'idle' && agentState !== 'done')}
            className="px-6 bg-zero-primary hover:bg-zero-primary/90 text-white rounded-lg font-bold tracking-wide transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
            {isHunting ? <Loader2 className="animate-spin" /> : 'HUNT'}
            </button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
        {/* Terminal / Log */}
        <div className="lg:col-span-1 bg-black/90 rounded-xl border border-zero-border p-4 font-mono text-xs overflow-hidden flex flex-col shadow-inner">
          <div className="flex items-center gap-2 text-muted-foreground border-b border-white/10 pb-2 mb-2">
            <Terminal size={14} />
            <span>TERMINAL_OUTPUT</span>
          </div>
          <div className="flex-1 overflow-y-auto space-y-1 text-green-400/90 scrollbar-hide">
            {logs.length === 0 && <span className="text-white/20">Ready for input...</span>}
            {logs.map((log, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
              >
                {log}
              </motion.div>
            ))}
            <div ref={terminalEndRef} />
          </div>
        </div>

        {/* Results / Agent Area */}
        <div className="lg:col-span-2 overflow-y-auto pr-2 space-y-6">
          
          {/* Tabs / Breadcrumbs */}
          {results && (
              <div className="flex items-center gap-4 border-b border-zero-border pb-2 mb-4">
                  <button 
                    onClick={() => setViewMode('hunt')}
                    className={`text-sm font-bold flex items-center gap-2 transition-colors ${viewMode === 'hunt' ? 'text-zero-primary' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                      <Database size={14} /> RAW DATA
                  </button>
                  <span className="text-muted-foreground">/</span>
                  <button 
                    onClick={() => results && handleProcess()}
                    disabled={viewMode === 'agent' && agentState !== 'done'}
                    className={`text-sm font-bold flex items-center gap-2 transition-colors ${viewMode === 'agent' ? 'text-zero-secondary' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                      <Brain size={14} /> AGENT CORE
                  </button>
              </div>
          )}

          <AnimatePresence mode="popLayout">
            {viewMode === 'hunt' && results?.prey && results.prey.map((item, index) => (
              <motion.div
                key={`hunt-${index}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: index * 0.1 }}
                className="bg-zero-card border border-zero-border rounded-xl p-5 hover:border-zero-primary/50 transition-all group relative overflow-hidden"
              >
                {/* Decoration Line */}
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-zero-primary to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg text-foreground line-clamp-1 group-hover:text-zero-primary transition-colors">
                    {item.title}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-muted-foreground bg-zero-border px-2 py-1 rounded">
                      ENTROPY: {((item.entropy || item.score) * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
                
                <p className="text-muted-foreground text-sm line-clamp-2 mb-4">
                  {item.content}
                </p>

                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-4 text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Database size={12} />
                      {item.source || 'WEB'}
                    </span>
                    <a 
                      href={item.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="hover:text-zero-primary hover:underline flex items-center gap-1"
                    >
                      SOURCE_LINK <ArrowRight size={10} />
                    </a>
                  </div>
                  
                  <div className="text-zero-secondary font-mono">
                     STATUS: INGESTED
                  </div>
                </div>
              </motion.div>
            ))}

            {viewMode === 'agent' && (
                <div className="space-y-6">
                    {/* Step 1: Trend Report */}
                    {trendReport && (
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-zero-card border border-zero-secondary/30 rounded-xl p-6 shadow-lg shadow-zero-secondary/5"
                        >
                            <div className="flex items-center gap-2 mb-4 text-zero-secondary">
                                <Sparkles size={20} />
                                <h2 className="font-bold text-xl">TREND ANALYSIS</h2>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-mono text-muted-foreground uppercase">Topic</label>
                                    <div className="text-lg font-bold">{trendReport.topic}</div>
                                </div>
                                <div>
                                    <label className="text-xs font-mono text-muted-foreground uppercase">Summary</label>
                                    <p className="text-sm text-muted-foreground leading-relaxed">{trendReport.summary}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-mono text-muted-foreground uppercase">Inspiration Points</label>
                                    <ul className="list-disc list-inside text-sm text-foreground/80 space-y-1 mt-1">
                                        {trendReport.inspiration_points.map((pt, i) => (
                                            <li key={i}>{pt}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Step 2: Methodology */}
                    {writingMethod && (
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-zero-card border border-blue-500/30 rounded-xl p-6 shadow-lg shadow-blue-500/5"
                        >
                            <div className="flex items-center gap-2 mb-4 text-blue-400">
                                <Brain size={20} />
                                <h2 className="font-bold text-xl">METHODOLOGY</h2>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-mono text-muted-foreground uppercase">Strategy</label>
                                    <div className="text-lg font-bold">{writingMethod.method_name}</div>
                                </div>
                                <div className="p-3 bg-black/20 rounded-lg border border-white/5 font-mono text-xs text-blue-300/80">
                                    {writingMethod.structure_template}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Step 3: Script */}
                    {draftScript && (
                         <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="bg-zero-card border border-green-500/30 rounded-xl p-6 shadow-lg shadow-green-500/5"
                        >
                            <div className="flex items-center gap-2 mb-4 text-green-400">
                                <FileText size={20} />
                                <h2 className="font-bold text-xl">GENERATED SCRIPT</h2>
                            </div>
                            <div className="prose prose-invert prose-sm max-w-none font-mono bg-black/40 p-4 rounded-lg border border-white/10 max-h-[500px] overflow-y-auto whitespace-pre-wrap">
                                {draftScript}
                            </div>
                            <div className="mt-4 flex justify-end gap-2">
                                <button className="px-4 py-2 bg-green-600/20 text-green-400 hover:bg-green-600/30 rounded-lg text-xs font-bold transition-colors flex items-center gap-2">
                                    <FileText size={14} /> EXPORT DOCX
                                </button>
                                <button 
                                    onClick={() => navigate('/editor', { state: { script: draftScript } })}
                                    className="px-4 py-2 bg-zero-primary/20 text-zero-primary hover:bg-zero-primary/30 rounded-lg text-xs font-bold transition-colors flex items-center gap-2"
                                >
                                    <PenTool size={14} /> REFINE IN EDITOR
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {agentState !== 'idle' && agentState !== 'done' && (
                        <div className="flex items-center justify-center py-12">
                             <div className="flex flex-col items-center gap-4">
                                <Loader2 size={32} className="animate-spin text-zero-secondary" />
                                <span className="font-mono text-xs text-muted-foreground animate-pulse">
                                    {agentState === 'analyzing' && 'NEURAL NET: PROCESSING PATTERNS...'}
                                    {agentState === 'learning' && 'ARCHIVE: RETRIEVING PROTOCOLS...'}
                                    {agentState === 'drafting' && 'CORE: GENERATING CONTENT...'}
                                </span>
                             </div>
                        </div>
                    )}
                </div>
            )}

          </AnimatePresence>
          
          {!results && !isHunting && (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground/30 space-y-4">
              <Database size={64} strokeWidth={1} />
              <p className="font-mono text-sm">AWAITING TARGET COORDINATES</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
