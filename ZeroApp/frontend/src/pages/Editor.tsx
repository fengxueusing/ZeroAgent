import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, Download, ArrowLeft, Wand2, FileText, History, X, Send, Clock, File } from 'lucide-react';
import { refineScript, saveDraft, listDrafts, getDraft, DraftFile } from '../services/agentService';

export function Editor() {
  const location = useLocation();
  const navigate = useNavigate();
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [isRefining, setIsRefining] = useState(false);
  const [showRefineInput, setShowRefineInput] = useState(false);
  const [refineInstruction, setRefineInstruction] = useState('');
  
  // History State
  const [showHistory, setShowHistory] = useState(false);
  const [drafts, setDrafts] = useState<DraftFile[]>([]);

  useEffect(() => {
    if (location.state?.script) {
      setContent(location.state.script);
    }
  }, [location.state]);

  const loadDrafts = async () => {
      try {
          const files = await listDrafts();
          setDrafts(files);
      } catch (e) {
          console.error("Failed to load drafts", e);
      }
  };

  const handleLoadDraft = async (filename: string) => {
      try {
          const { content } = await getDraft(filename);
          setContent(content);
          setShowHistory(false);
      } catch (e) {
          console.error("Failed to load draft content", e);
      }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `draft_${timestamp}.md`;
        await saveDraft(filename, content);
        setLastSaved(new Date().toLocaleTimeString());
    } catch (e) {
        console.error('Save failed', e);
    } finally {
        setIsSaving(false);
    }
  };

  const handleRefine = async () => {
    if (!refineInstruction.trim()) return;
    
    setIsRefining(true);
    try {
        const { script } = await refineScript(content, refineInstruction);
        setContent(script);
        setShowRefineInput(false);
        setRefineInstruction('');
    } catch (e) {
        console.error('Refinement failed', e);
    } finally {
        setIsRefining(false);
    }
  };

  return (
    <div className="h-full flex flex-col gap-6 relative">
      {/* History Side Panel */}
      <AnimatePresence>
        {showHistory && (
            <>
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setShowHistory(false)}
                    className="absolute inset-0 bg-black/50 backdrop-blur-sm z-40"
                />
                <motion.div 
                    initial={{ x: '100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '100%' }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className="absolute right-0 top-0 bottom-0 w-80 bg-zero-card border-l border-zero-border shadow-2xl z-50 p-6 flex flex-col"
                >
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold flex items-center gap-2">
                            <History size={18} /> VERSION HISTORY
                        </h3>
                        <button onClick={() => setShowHistory(false)} className="text-muted-foreground hover:text-foreground">
                            <X size={18} />
                        </button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                        {drafts.length === 0 ? (
                            <div className="text-center text-muted-foreground py-10">
                                <Clock size={32} className="mx-auto mb-2 opacity-50" />
                                <p className="text-xs">NO SAVED DRAFTS</p>
                            </div>
                        ) : (
                            drafts.map((draft) => (
                                <button 
                                    key={draft.filename}
                                    onClick={() => handleLoadDraft(draft.filename)}
                                    className="w-full text-left p-3 rounded-lg bg-black/20 hover:bg-zero-primary/10 border border-transparent hover:border-zero-primary/30 transition-all group"
                                >
                                    <div className="flex items-center gap-2 mb-1">
                                        <File size={14} className="text-muted-foreground group-hover:text-zero-primary" />
                                        <span className="text-sm font-medium text-foreground truncate">{draft.filename}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-[10px] text-muted-foreground font-mono">
                                        <span>{new Date(draft.updated_at).toLocaleString()}</span>
                                        <span>{(draft.size / 1024).toFixed(1)} KB</span>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </motion.div>
            </>
        )}
      </AnimatePresence>

      {/* Refine Overlay */}
      <AnimatePresence>
        {showRefineInput && (
            <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="absolute top-20 left-1/2 -translate-x-1/2 w-[500px] z-50 bg-zero-card border border-zero-primary/30 shadow-2xl shadow-zero-primary/10 rounded-xl p-4 backdrop-blur-md"
            >
                <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm font-bold flex items-center gap-2 text-zero-primary">
                        <Wand2 size={14} /> AI REFINEMENT PROTOCOL
                    </h3>
                    <button onClick={() => setShowRefineInput(false)} className="text-muted-foreground hover:text-foreground">
                        <X size={14} />
                    </button>
                </div>
                <div className="relative">
                    <input 
                        autoFocus
                        type="text" 
                        value={refineInstruction}
                        onChange={(e) => setRefineInstruction(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleRefine()}
                        placeholder="e.g. Make the dialogue more sarcastic..."
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-zero-primary/50 pr-10"
                    />
                    <button 
                        onClick={handleRefine}
                        disabled={isRefining}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-zero-primary/20 text-zero-primary rounded-md hover:bg-zero-primary/30 transition-colors disabled:opacity-50"
                    >
                        {isRefining ? <Wand2 size={14} className="animate-spin" /> : <Send size={14} />}
                    </button>
                </div>
            </motion.div>
        )}
      </AnimatePresence>

      {/* Header Actions */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-zero-border rounded-lg transition-colors text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Script Editor</h1>
            <p className="text-xs text-muted-foreground font-mono">
                WORKSPACE / {lastSaved ? `LAST SAVED: ${lastSaved}` : 'UNSAVED'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
                loadDrafts();
                setShowHistory(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-zero-card border border-zero-border hover:border-zero-primary/50 rounded-lg text-sm transition-all text-muted-foreground hover:text-foreground"
          >
            <History size={16} />
            <span>History</span>
          </button>
          <button 
            onClick={() => setShowRefineInput(!showRefineInput)}
            className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-sm transition-all ${showRefineInput ? 'bg-zero-primary/10 border-zero-primary text-zero-primary' : 'bg-zero-card border-zero-border text-muted-foreground hover:text-foreground hover:border-zero-primary/50'}`}
          >
             <Wand2 size={16} />
             <span>AI Refine</span>
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-zero-primary hover:bg-zero-primary/90 text-black font-bold rounded-lg text-sm transition-all shadow-lg shadow-zero-primary/20"
          >
            <Save size={16} />
            <span>{isSaving ? 'SAVING...' : 'SAVE'}</span>
          </button>
        </div>
      </div>

      {/* Editor Area */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-1 bg-zero-card border border-zero-border rounded-xl shadow-sm overflow-hidden flex flex-col"
      >
        <div className="bg-black/20 border-b border-zero-border p-3 flex items-center justify-between">
           <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground">
              <span className="flex items-center gap-1"><FileText size={12}/> MARKDOWN MODE</span>
              <span>WORDS: {content.split(/\s+/).filter(w => w.length > 0).length}</span>
              <span>CHARS: {content.length}</span>
           </div>
           <button className="text-xs flex items-center gap-1 text-muted-foreground hover:text-zero-primary transition-colors">
              <Download size={12} /> EXPORT
           </button>
        </div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="flex-1 bg-transparent p-8 resize-none focus:outline-none font-mono text-sm leading-relaxed text-foreground/90 selection:bg-zero-primary/30"
          placeholder="// Start writing or import a script..."
          spellCheck={false}
        />
      </motion.div>
    </div>
  );
}
