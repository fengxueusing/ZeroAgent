import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { X, Send, Cpu, Activity, Zap, Maximize2, Minimize2, Paperclip, FileIcon, ImageIcon, Terminal, Loader2, Check, AlertCircle, ChevronDown, ChevronRight, Settings, History, PlusCircle, MessageSquare, Trash2, Search, Hash, Wrench } from 'lucide-react';
import { cn } from '../lib/utils';
import api from '../lib/api';
import { historyService, Conversation } from '../services/historyService';

interface ToolCall {
  id: string;
  name: string;
  args: any;
  status: 'running' | 'completed' | 'failed';
  result?: string;
}

interface FileProgress {
    name: string;
    size: number;
    status: 'pending' | 'uploading' | 'completed' | 'error';
    progress: number;
}

interface UploadBatchMeta {
    files: FileProgress[];
    logs: string[];
    overallStatus: 'active' | 'completed' | 'failed';
}

const UploadStatusBar = ({ data }: { data: UploadBatchMeta }) => {
    if (!data) return null;
    
    const totalFiles = data.files.length;
    const uploadedFiles = data.files.filter(f => f.status === 'completed').length;
    const currentFile = data.files.find(f => f.status === 'uploading');
    // Calculate overall batch progress for a smooth, single bar experience
    const progress = ((uploadedFiles * 100) + (currentFile ? currentFile.progress : 0)) / (totalFiles || 1);
    
    return (
        <div className="absolute bottom-full left-0 right-0 mb-2 px-4 z-10">
            <div className="bg-black/80 backdrop-blur border border-zero-primary/30 rounded-lg p-2 flex items-center gap-3 shadow-[0_0_15px_rgba(56,189,248,0.2)]">
                <Activity size={16} className="text-zero-primary animate-pulse" />
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between text-[10px] font-mono mb-1 text-zero-primary/80">
                        <span>
                            {data.overallStatus === 'active' ? 'UPLOADING...' : data.overallStatus === 'completed' ? 'COMPLETE' : 'FAILED'} 
                            <span className="text-white ml-2">
                                {currentFile ? currentFile.name : `${uploadedFiles}/${totalFiles} FILES`}
                            </span>
                        </span>
                        <span>{Math.round(progress)}%</span>
                    </div>
                    <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                        <motion.div 
                            className={cn(
                                "h-full shadow-[0_0_10px_rgba(56,189,248,0.5)]",
                                data.overallStatus === 'failed' ? "bg-red-500" : 
                                data.overallStatus === 'completed' ? "bg-green-500" : "bg-zero-primary"
                            )}
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ type: "spring", stiffness: 100, damping: 20 }}
                        />
                    </div>
                </div>
                {data.overallStatus === 'active' ? (
                    <Loader2 size={14} className="animate-spin text-muted-foreground" />
                ) : data.overallStatus === 'completed' ? (
                    <Check size={14} className="text-green-500" />
                ) : (
                    <AlertCircle size={14} className="text-red-500" />
                )}
            </div>
        </div>
    );
};

const ToolCallItem = ({ tool }: { tool: ToolCall }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Auto-expand if running or failed
  useEffect(() => {
    if (tool.status === 'running' || tool.status === 'failed') {
      setIsOpen(true);
    } else {
        // Auto collapse on success to save space
        setIsOpen(false); 
    }
  }, [tool.status]);

  // Special rendering for 'generate_snowtool'
  if (tool.name === 'generate_snowtool' && tool.status === 'completed') {
      return (
        <div className="bg-zero-card/50 rounded-lg border border-zero-border overflow-hidden mb-2">
             <div className="flex items-center gap-2 p-2 bg-black/20 border-b border-zero-border/50">
                 <Wrench size={14} className="text-zero-primary" />
                 <span className="text-xs font-mono font-bold text-white">SnowTool Generated</span>
             </div>
             <div className="p-3 text-xs">
                 <div className="flex items-center justify-between mb-2">
                     <span className="font-mono text-zero-primary">{tool.args.filename}</span>
                     <span className="text-[10px] text-muted-foreground bg-white/5 px-2 py-0.5 rounded">PYTHON</span>
                 </div>
                 <p className="text-muted-foreground mb-3">{tool.args.description}</p>
                 <div className="bg-black/30 p-2 rounded border border-white/5 font-mono text-[10px] text-green-400 overflow-x-auto whitespace-pre">
                     {tool.result}
                 </div>
             </div>
        </div>
      );
  }

  // Special rendering for 'execute_shell'
  if (tool.name === 'execute_shell' && tool.status === 'completed') {
    return (
      <div className="bg-black rounded-lg border border-white/10 overflow-hidden mb-2 font-mono">
           <div className="flex items-center gap-2 p-1.5 bg-white/5 border-b border-white/5">
               <Terminal size={12} className="text-green-500" />
               <span className="text-[10px] text-muted-foreground truncate">{tool.args.command}</span>
           </div>
           <div className="p-2 text-[10px] text-gray-300 overflow-x-auto whitespace-pre-wrap max-h-40 overflow-y-auto">
               {tool.result}
           </div>
      </div>
    );
  }

  return (
    <div className="bg-black/5 rounded-lg border border-zero-border/50 overflow-hidden mb-2 transition-all duration-200">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 p-2 text-xs font-mono hover:bg-black/5 transition-colors text-left"
      >
        {tool.status === 'running' ? (
           <Loader2 className="animate-spin text-zero-primary shrink-0" size={12}/>
        ) : tool.status === 'failed' ? (
           <AlertCircle className="text-red-500 shrink-0" size={12}/>
        ) : (
           <Check className="text-green-500 shrink-0" size={12}/>
        )}
        <span className={cn(
            "font-bold opacity-80",
            tool.status === 'failed' && "text-red-500"
        )}>{tool.name}</span>
        
        <div className="ml-auto flex items-center gap-2 opacity-50">
            <span className="text-[10px] uppercase">{tool.status}</span>
            {isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        </div>
      </button>
      
      <AnimatePresence>
        {isOpen && (
            <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
            >
                <div className="p-2 border-t border-zero-border/50 text-[10px] font-mono space-y-2 bg-black/5">
                <div>
                    <div className="opacity-50 mb-1 font-bold">ARGUMENTS</div>
                    <pre className="overflow-x-auto p-2 bg-black/10 rounded text-muted-foreground border border-white/5">
                    {JSON.stringify(tool.args, null, 2)}
                    </pre>
                </div>
                {tool.result && (
                    <div>
                    <div className="opacity-50 mb-1 font-bold">RESULT</div>
                    <div className="p-2 bg-black/10 rounded text-muted-foreground max-h-40 overflow-y-auto whitespace-pre-wrap border border-white/5 custom-scrollbar">
                        {tool.result}
                    </div>
                    </div>
                )}
                </div>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  toolCalls?: ToolCall[];
  meta?: {
    reaction?: string;
    voidLevel?: number;
    file?: {
      name: string;
      type: string;
    };
    uploadBatch?: UploadBatchMeta;
  };
}

interface EngineStatus {
  void_level: number;
  carbon_level: number;
  rpm: number;
}

export function ChatOverlay({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      content: "Zero System Online. Waiting for input.",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [engineStatus, setEngineStatus] = useState<EngineStatus | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarTimestamp, setAvatarTimestamp] = useState(Date.now());
  const [imgError, setImgError] = useState(false);
  const [modules, setModules] = useState<string[]>(['default']);
  const [selectedModule, setSelectedModule] = useState('default');
  const [showModuleSelector, setShowModuleSelector] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [uploadState, setUploadState] = useState<UploadBatchMeta | null>(null);
  
  // History State
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Initialize History
  useEffect(() => {
    if (isOpen) {
        historyService.listConversations().then(setConversations).catch(console.error);
    }
  }, [isOpen]);

  // Search Effect
  useEffect(() => {
    if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
    }

    const timer = setTimeout(() => {
        setIsSearching(true);
        historyService.searchConversations(searchQuery)
            .then(setSearchResults)
            .catch(console.error)
            .finally(() => setIsSearching(false));
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleNewChat = () => {
      setCurrentConversationId(null);
      setMessages([]);
      // Optionally create on backend now or wait for first message
      // We'll wait for first message to keep it clean, but backend supports explicit create.
      // Actually, if we want an ID immediately, we should create it.
      // But let's stick to: "New Chat" clears UI. First message creates it IF id is null.
      // Wait, my backend logic: if conversation_id is passed, it uses it. If not, it falls back to stateless or creates new?
      // Backend chat endpoint: If NO id, it just processes statelessly. It does NOT return a new ID.
      // So the frontend MUST create the conversation first if we want history tracking.
      
      historyService.createConversation("New Chat").then(conv => {
          setCurrentConversationId(conv.id);
          setConversations(prev => [conv, ...prev]);
      });
  };

  const loadConversation = async (id: string) => {
      try {
          setIsLoading(true);
          const conv = await historyService.getConversation(id);
          setCurrentConversationId(conv.id);
          
          // Map backend messages to frontend format
          const mappedMessages: Message[] = (conv.messages || []).map((m: any, idx: number) => ({
              id: `hist-${id}-${idx}`,
              role: m.role as 'user' | 'assistant',
              content: m.content || '',
              toolCalls: m.tool_calls ? m.tool_calls.map((tc: any) => ({
                  id: tc.id,
                  name: tc.function.name,
                  args: typeof tc.function.arguments === 'string' ? JSON.parse(tc.function.arguments || '{}') : tc.function.arguments,
                  status: 'completed' // History is always completed
              })) : undefined,
              timestamp: new Date(m.timestamp ? m.timestamp * 1000 : Date.now())
          }));
          
          setMessages(mappedMessages);
          setShowHistory(false); // Close history panel on select
      } catch (e) {
          console.error("Failed to load conversation", e);
      } finally {
          setIsLoading(false);
      }
  };

  const deleteConversation = async (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      if (confirm("Delete this conversation?")) {
          await historyService.deleteConversation(id);
          setConversations(prev => prev.filter(c => c.id !== id));
          if (currentConversationId === id) {
              handleNewChat();
          }
      }
  };

  useEffect(() => {
    const fetchModules = () => {
        api.get('/chat/modules')
            .then(res => {
                if (res.data && res.data.modules) {
                    setModules(res.data.modules);
                }
            })
            .catch(err => console.error("Failed to fetch modules", err));
    };

    fetchModules();

    const handleModuleUpdate = () => fetchModules();
    window.addEventListener('modules-updated', handleModuleUpdate);
    return () => window.removeEventListener('modules-updated', handleModuleUpdate);
  }, []);

  useEffect(() => {
    const handleUpdate = () => {
       setAvatarTimestamp(Date.now());
       setImgError(false);
    };
    window.addEventListener('avatar-updated', handleUpdate);
    return () => window.removeEventListener('avatar-updated', handleUpdate);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isExpanded]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setPendingFiles(prev => [...prev, ...Array.from(e.target.files || [])]);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removePendingFile = (index: number) => {
    setPendingFiles(prev => prev.filter((_, i) => i !== index));
  };

  const sendMessage = async () => {
    if ((!input.trim() && pendingFiles.length === 0) || isLoading) return;

    // 1. Display User Message immediately
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
      meta: pendingFiles.length > 0 ? {
          file: {
              name: `${pendingFiles.length} file(s)`,
              type: 'batch'
          }
      } : undefined
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    // 2. Handle File Uploads (Launch Sequence)
    if (pendingFiles.length > 0) {
        const initialBatchMeta: UploadBatchMeta = {
            files: pendingFiles.map(f => ({
                name: f.name,
                size: f.size,
                status: 'pending',
                progress: 0
            })),
            logs: [`[SYSTEM] Initializing secure handshake...`],
            overallStatus: 'active'
        };

        setUploadState(initialBatchMeta);

        try {
            for (let i = 0; i < pendingFiles.length; i++) {
                const file = pendingFiles[i];
                
                // Update status to uploading
                setUploadState(prev => {
                    if (!prev) return null;
                    const newFiles = [...prev.files];
                    newFiles[i] = { ...newFiles[i], status: 'uploading', progress: 10 };
                    return {
                        ...prev,
                        files: newFiles,
                        logs: [...prev.logs, `[UPLOAD] Stream ${i+1}/${pendingFiles.length}: "${file.name}" opened...`]
                    };
                });

                // Simulate progress (optional aesthetic touch)
                await new Promise(r => setTimeout(r, 500));
                setUploadState(prev => {
                    if (!prev) return null;
                    const newFiles = [...prev.files];
                    newFiles[i] = { ...newFiles[i], progress: 60 };
                    return { ...prev, files: newFiles };
                });

                const formData = new FormData();
                formData.append('file', file);

                // Use the existing /files/upload endpoint which ingests into Void Engine
                const res = await api.post('/files/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });

                if (res.data.current_status) {
                    setEngineStatus(res.data.current_status);
                }

                // Mark as completed
                setUploadState(prev => {
                    if (!prev) return null;
                    const newFiles = [...prev.files];
                    newFiles[i] = { ...newFiles[i], status: 'completed', progress: 100 };
                    return {
                        ...prev,
                        files: newFiles,
                        logs: [...prev.logs, `[SUCCESS] "${file.name}" integrated.`]
                    };
                });
            }

            // All uploads done
            setUploadState(prev => prev ? { ...prev, overallStatus: 'completed' } : null);
            
            // Clear pending files
            setPendingFiles([]);
            
            // Clear upload status after a short delay
            setTimeout(() => setUploadState(null), 3000);

        } catch (err: any) {
            console.error('Batch upload failed:', err);
            setUploadState(prev => prev ? { 
                ...prev, 
                overallStatus: 'failed',
                logs: [...prev.logs, `[ERROR] Connection severed: ${err.message}`]
            } : null);
            setIsLoading(false);
            return; // Stop if upload fails
        }
    }

    // 3. Send Chat Request (The Engine now has the file context)
    // Ensure we have a conversation ID for history
    let activeConversationId = currentConversationId;
    
    if (!activeConversationId) {
        try {
            // Auto-create conversation if none exists
            // Use first few words as title or default to "New Chat"
            const title = userMsg.content.slice(0, 30) || "New Chat";
            const newConv = await historyService.createConversation(title);
            activeConversationId = newConv.id;
            setCurrentConversationId(newConv.id);
            // Update local list
            setConversations(prev => [newConv, ...prev]);
        } catch (e) {
            console.error("Failed to create conversation history:", e);
            // Continue without history if creation fails
        }
    }

    const botMsgId = (Date.now() + 2).toString();
    const botMsg: Message = {
      id: botMsgId,
      role: 'assistant',
      content: '', 
      timestamp: new Date(),
      toolCalls: []
    };
    
    try {
      // Use the stream endpoint
      const response = await fetch('http://localhost:8000/api/v1/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            message: userMsg.content || (pendingFiles.length > 0 ? "Analyze the uploaded files." : "Hello"), 
            fuel_type: "daily_chat",
            module_name: selectedModule,
            conversation_id: activeConversationId // Use the ensured ID
        })
      });

      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
            if (line.startsWith('data: ')) {
                const jsonStr = line.slice(6);
                try {
                    const event = JSON.parse(jsonStr);
                    
                    setMessages(prev => {
                        let currentMessages = prev;
                        if (!currentMessages.some(m => m.id === botMsgId)) {
                            currentMessages = [...currentMessages, botMsg];
                        }

                        return currentMessages.map(msg => {
                            if (msg.id !== botMsgId) return msg;

                            if (event.type === 'message') return { ...msg, content: event.content };
                            if (event.type === 'content_delta') return { ...msg, content: (msg.content || '') + event.content };
                            if (event.type === 'tool_start') {
                                const newTool: ToolCall = {
                                    id: Date.now().toString() + Math.random(),
                                    name: event.tool,
                                    args: event.args,
                                    status: 'running'
                                };
                                return { ...msg, toolCalls: [...(msg.toolCalls || []), newTool] };
                            }
                            if (event.type === 'tool_end') {
                                return {
                                    ...msg,
                                    toolCalls: (msg.toolCalls || []).map(t => 
                                        t.name === event.tool && t.status === 'running' ? { ...t, status: event.is_error ? 'failed' : 'completed', result: event.result } : t
                                    )
                                };
                            }
                            return msg;
                        });
                    });
                } catch (e) {
                    console.error("Error parsing event", e);
                }
            }
        }
      }
    } catch (error) {
      const errorMsg: Message = {
        id: (Date.now() + 3).toString(),
        role: 'assistant',
        content: "Error: Connection to Void Engine lost.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Drawer / Modal */}
          <motion.div
            initial={{ x: '100%', width: '450px' }}
            animate={{ 
              x: 0,
              width: isExpanded ? '80%' : '450px',
              left: isExpanded ? '10%' : 'auto',
              right: isExpanded ? '10%' : '0',
            }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={cn(
              "fixed top-0 bottom-0 bg-background/95 backdrop-blur-xl border-l border-zero-border shadow-2xl z-50 flex flex-col transition-all duration-300",
              isExpanded && "border-r rounded-xl my-4 top-4 bottom-4"
            )}
          >
            {/* Header */}
            <div className="h-16 border-b border-zero-border flex items-center justify-between px-6 bg-zero-card/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-zero-primary to-zero-secondary flex items-center justify-center text-white">
                  <Cpu size={18} />
                </div>
                <div>
                  <h2 className="font-bold text-foreground">Zero Core</h2>
                  <div className="relative">
                      <button 
                          onClick={() => setShowModuleSelector(!showModuleSelector)}
                          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-zero-primary transition-colors mt-0.5"
                      >
                          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                          <span className="uppercase font-mono">{selectedModule} MODE</span>
                          <ChevronDown size={10} />
                      </button>
                      
                      <AnimatePresence>
                          {showModuleSelector && (
                              <motion.div
                                  initial={{ opacity: 0, y: 5 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: 5 }}
                                  className="absolute top-full left-0 mt-2 w-40 bg-zero-card border border-zero-border rounded-lg shadow-xl z-50 overflow-hidden py-1"
                              >
                                  {modules.map(mod => (
                                      <button
                                          key={mod}
                                          onClick={() => {
                                              setSelectedModule(mod);
                                              setShowModuleSelector(false);
                                              setMessages(prev => [...prev, {
                                                  id: Date.now().toString(),
                                                  role: 'assistant',
                                                  content: `System: Switched to [${mod.toUpperCase()}] module.`,
                                                  timestamp: new Date()
                                              }]);
                                          }}
                                          className={cn(
                                              "w-full text-left px-3 py-2 text-xs hover:bg-zero-primary/10 hover:text-zero-primary transition-colors flex items-center gap-2",
                                              selectedModule === mod && "text-zero-primary font-bold bg-zero-primary/5"
                                          )}
                                      >
                                          {selectedModule === mod && <div className="w-1.5 h-1.5 rounded-full bg-zero-primary" />}
                                          <span className="uppercase font-mono">{mod}</span>
                                      </button>
                                  ))}
                              </motion.div>
                          )}
                      </AnimatePresence>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className={cn(
                      "p-2 hover:bg-zero-border rounded-lg transition-colors text-muted-foreground hover:text-foreground",
                      showHistory && "text-zero-primary bg-zero-primary/10"
                  )}
                  title="History"
                >
                  <History size={18} />
                </button>
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="p-2 hover:bg-zero-border rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                  title={isExpanded ? "Collapse" : "Expand"}
                >
                  {isExpanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                </button>
                <button 
                  onClick={onClose}
                  className="p-2 hover:bg-zero-border rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Engine Status Bar */}
            <div className="px-6 py-3 bg-zero-card/30 border-b border-zero-border grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground uppercase font-mono">
                  <Activity size={10} /> Void Level
                </div>
                <div className="h-1 bg-zero-border rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${engineStatus?.void_level || 50}%` }}
                    className="h-full bg-zero-primary transition-all duration-500"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground uppercase font-mono">
                  <Zap size={10} /> RPM
                </div>
                <div className="h-1 bg-zero-border rounded-full overflow-hidden">
                   <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(engineStatus?.rpm || 1000) / 8000 * 100}%` }}
                    className="h-full bg-zero-secondary transition-all duration-500"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground uppercase font-mono">
                  <Cpu size={10} /> Carbon
                </div>
                <div className="h-1 bg-zero-border rounded-full overflow-hidden">
                   <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${engineStatus?.carbon_level || 10}%` }}
                    className="h-full bg-zero-accent transition-all duration-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex-1 flex overflow-hidden relative">
                {/* History Sidebar */}
                <AnimatePresence>
                    {showHistory && (
                        <motion.div
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: 220, opacity: 1 }}
                            exit={{ width: 0, opacity: 0 }}
                            className="border-r border-zero-border bg-black/20 flex flex-col shrink-0 backdrop-blur-sm"
                        >
                            <button 
                                onClick={handleNewChat}
                                className="m-3 p-2 bg-zero-primary/10 hover:bg-zero-primary/20 text-zero-primary rounded-lg flex items-center gap-2 text-xs font-bold transition-colors border border-zero-primary/20 justify-center"
                            >
                                <PlusCircle size={14} /> NEW CHAT
                            </button>

                            <div className="px-3 mb-2 relative">
                                <Search size={12} className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                <input 
                                    type="text"
                                    placeholder="Search memories..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-black/20 border border-zero-border rounded-md pl-7 pr-2 py-1.5 text-xs text-white placeholder:text-muted-foreground focus:outline-none focus:border-zero-primary/50 transition-colors"
                                />
                            </div>

                            <div className="flex-1 overflow-y-auto px-2 space-y-1 pb-4">
                                {searchQuery ? (
                                    <>
                                        {isSearching ? (
                                            <div className="text-center py-4 text-xs text-muted-foreground flex items-center justify-center gap-2">
                                                <Loader2 size={12} className="animate-spin" /> Searching...
                                            </div>
                                        ) : searchResults.length === 0 ? (
                                            <div className="text-center py-4 text-xs text-muted-foreground">
                                                No matches found.
                                            </div>
                                        ) : (
                                            searchResults.map((res, idx) => (
                                                <div 
                                                    key={`${res.conversation_id}-${idx}`}
                                                    onClick={() => loadConversation(res.conversation_id)}
                                                    className="group flex flex-col p-2 rounded-lg cursor-pointer transition-colors text-xs border border-transparent text-muted-foreground hover:bg-white/5 hover:text-foreground"
                                                >
                                                    <div className="flex items-center gap-2 mb-1 justify-between">
                                                        <div className="flex items-center gap-2 min-w-0">
                                                            <MessageSquare size={12} className="shrink-0 text-zero-primary" />
                                                            <span className="truncate font-mono font-bold">{res.conversation_title}</span>
                                                        </div>
                                                        <span className="text-[10px] text-muted-foreground/50 shrink-0 font-mono">
                                                            {formatRelativeTime(res.timestamp)}
                                                        </span>
                                                    </div>
                                                    <div className="text-[10px] opacity-70 line-clamp-2 pl-5 italic">
                                                        "{res.content_snippet}"
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </>
                                ) : (
                                    conversations.map(c => (
                                    <div 
                                        key={c.id}
                                        onClick={() => loadConversation(c.id)}
                                        className={cn(
                                            "group flex flex-col p-2 rounded-lg cursor-pointer transition-colors text-xs border border-transparent",
                                            currentConversationId === c.id ? "bg-white/10 text-white border-white/5" : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                                        )}
                                    >
                                        <div className="flex items-center gap-2">
                                            <MessageSquare size={12} className="shrink-0" />
                                            <span className="truncate flex-1 font-mono">{c.title}</span>
                                            <button 
                                                onClick={(e) => deleteConversation(e, c.id)}
                                                className="opacity-0 group-hover:opacity-100 hover:text-red-500 transition-opacity p-1"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                        {c.tags && c.tags.length > 0 && (
                                            <div className="flex gap-1.5 mt-1.5 ml-5 flex-wrap">
                                                {c.tags.slice(0, 4).map((tag, i) => (
                                                    <span key={i} className="text-[9px] bg-white/5 px-1.5 py-0.5 rounded text-muted-foreground/70 flex items-center gap-0.5 border border-white/5">
                                                        <Hash size={8} className="opacity-50" /> {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="flex-1 flex flex-col min-w-0">
                    <div className="flex-1 overflow-y-auto p-6 space-y-6" ref={scrollRef}>
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex gap-3 max-w-[90%]",
                    msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0 overflow-hidden",
                    msg.role === 'user' ? "bg-zero-border" : "bg-zero-primary/20 text-zero-primary"
                  )}>
                    {msg.role === 'user' ? (
                        <div className="w-2 h-2 bg-foreground rounded-full" /> 
                    ) : msg.toolCalls?.some(t => t.status === 'running') ? (
                        <Settings size={16} className="animate-spin" />
                    ) : !imgError ? (
                        <img 
                           src={`http://localhost:8000/static/avatar.png?t=${avatarTimestamp}`}
                           onError={() => setImgError(true)}
                           className="w-full h-full object-cover"
                        />
                    ) : (
                        <Cpu size={16} />
                    )}
                  </div>
                  
                  <div className={cn(
                    "p-3 rounded-2xl text-sm leading-relaxed",
                    msg.role === 'user' 
                      ? "bg-zero-primary text-white rounded-tr-none" 
                      : "bg-zero-card border border-zero-border text-foreground rounded-tl-none"
                  )}>
                    {msg.meta?.file && (
                      <div className="flex items-center gap-2 mb-2 p-2 bg-black/10 rounded-lg">
                         {msg.meta.file.type.includes('image') ? <ImageIcon size={16} /> : <FileIcon size={16} />}
                         <span className="text-xs font-mono">{msg.meta.file.name}</span>
                      </div>
                    )}
                    
                    {msg.toolCalls && msg.toolCalls.length > 0 && (
                      <div className="flex flex-col mb-4">
                          {msg.toolCalls.map((tool, idx) => (
                              <ToolCallItem key={idx} tool={tool} />
                          ))}
                      </div>
                    )}

                    <div className="markdown-content text-sm">
                        <ReactMarkdown 
                            remarkPlugins={[remarkGfm]}
                            components={{
                                p: ({node, ...props}) => <p className="mb-3 last:mb-0 leading-relaxed" {...props} />,
                                a: ({node, ...props}) => <a className="text-zero-primary hover:underline font-medium decoration-zero-primary/30 underline-offset-2" target="_blank" rel="noopener noreferrer" {...props} />,
                                ul: ({node, ...props}) => <ul className="list-disc list-outside ml-4 mb-3 space-y-1 marker:text-zero-primary" {...props} />,
                                ol: ({node, ...props}) => <ol className="list-decimal list-outside ml-4 mb-3 space-y-1 marker:text-zero-primary" {...props} />,
                                li: ({node, ...props}) => <li className="pl-1" {...props} />,
                                blockquote: ({node, ...props}) => <blockquote className="border-l-2 border-zero-primary/50 pl-4 italic opacity-80 my-3 bg-zero-primary/5 py-2 rounded-r-lg" {...props} />,
                                code: ({node, inline, className, children, ...props}: any) => {
                                    return inline ? (
                                        <code className="bg-zero-primary/10 text-zero-primary px-1.5 py-0.5 rounded font-mono text-xs border border-zero-primary/20" {...props}>{children}</code>
                                    ) : (
                                        <div className="relative group">
                                            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <div className="w-2 h-2 rounded-full bg-red-500/50" />
                                                <div className="w-2 h-2 rounded-full bg-yellow-500/50" />
                                                <div className="w-2 h-2 rounded-full bg-green-500/50" />
                                            </div>
                                            <code className="block bg-black/20 p-4 rounded-lg font-mono text-xs overflow-x-auto my-3 border border-white/5 shadow-inner" {...props}>{children}</code>
                                        </div>
                                    )
                                },
                                h1: ({node, ...props}) => <h1 className="text-xl font-bold mb-3 mt-5 border-b border-white/10 pb-2 flex items-center gap-2" {...props}><span className="w-1 h-6 bg-zero-primary rounded-full inline-block" />{props.children}</h1>,
                                h2: ({node, ...props}) => <h2 className="text-lg font-bold mb-2 mt-4 text-foreground/90" {...props} />,
                                h3: ({node, ...props}) => <h3 className="text-base font-bold mb-2 mt-3 text-foreground/80" {...props} />,
                                strong: ({node, ...props}) => <strong className="font-bold text-foreground" {...props} />,
                                table: ({node, ...props}) => <div className="overflow-x-auto my-4 rounded-lg border border-white/10"><table className="min-w-full divide-y divide-white/10" {...props} /></div>,
                                thead: ({node, ...props}) => <thead className="bg-white/5" {...props} />,
                                tbody: ({node, ...props}) => <tbody className="divide-y divide-white/10" {...props} />,
                                tr: ({node, ...props}) => <tr className="" {...props} />,
                                th: ({node, ...props}) => <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider" {...props} />,
                                td: ({node, ...props}) => <td className="px-3 py-2 text-sm text-foreground/80" {...props} />,
                            }}
                        >
                            {msg.content || (msg.toolCalls && msg.toolCalls.length > 0 ? '' : '')}
                        </ReactMarkdown>
                    </div>

                    {msg.meta?.voidLevel !== undefined && (
                      <div className="mt-2 pt-2 border-t border-zero-border/50 text-[10px] font-mono text-muted-foreground flex justify-between">
                        <span>VOID_LEVEL_UPDATE</span>
                        <span>{msg.meta.voidLevel}%</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pulse Signal (Thinking Indicator) */}
            <AnimatePresence>
              {isLoading && (
                <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="border-t border-zero-primary/20 bg-zero-primary/5 backdrop-blur-sm overflow-hidden"
                >
                    <div className="px-6 py-2 flex items-center justify-between">
                         <div className="flex items-center gap-2 text-[10px] text-zero-primary font-mono tracking-widest uppercase">
                            <Activity size={12} className="animate-pulse" />
                            <span className="animate-pulse">ZERO LINK ACTIVE</span>
                         </div>
                         <div className="flex gap-1 items-end h-4">
                            {[1,2,3,4,5].map(i => (
                                <motion.div 
                                    key={i}
                                    animate={{ height: [4, 12, 4] }}
                                    transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.1, ease: "easeInOut" }}
                                    className="w-1 bg-zero-primary/60 rounded-full"
                                />
                            ))}
                         </div>
                    </div>
                    {/* The "Thin Line" */}
                    <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-zero-primary to-transparent opacity-50 animate-pulse" />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Input Area */}
            <div className="p-4 bg-background border-t border-zero-border relative">
              {uploadState && <UploadStatusBar data={uploadState} />}
              {/* Pending Files Staging Area */}
              {pendingFiles.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {pendingFiles.map((file, index) => (
                    <div key={index} className="flex items-center gap-2 bg-zero-card border border-zero-primary/30 rounded-lg px-3 py-1.5 animate-in fade-in slide-in-from-bottom-2">
                        <FileIcon size={14} className="text-zero-primary" />
                        <span className="text-xs text-foreground/90 max-w-[150px] truncate">{file.name}</span>
                        <span className="text-[10px] text-muted-foreground uppercase">{(file.size / 1024).toFixed(1)}KB</span>
                        <button 
                            onClick={() => removePendingFile(index)}
                            disabled={isLoading}
                            className="ml-1 hover:text-red-500 transition-colors disabled:opacity-0"
                        >
                            {!isLoading && <X size={14} />}
                        </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="relative flex gap-2">
                <input 
                  type="file" 
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handleFileUpload}
                  multiple // Allow multiple file selection
                />
                <button
                  onClick={() => !isLoading && fileInputRef.current?.click()}
                  className={cn(
                      "p-3 text-muted-foreground hover:text-foreground hover:bg-zero-border rounded-xl transition-colors",
                      isLoading && "opacity-50 cursor-not-allowed"
                  )}
                  title="Upload File"
                  disabled={isLoading}
                >
                  <Paperclip size={20} />
                </button>
                
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Talk to Zero..."
                  className="flex-1 bg-zero-card border border-zero-border rounded-xl py-3 pl-4 pr-12 focus:outline-none focus:border-zero-primary transition-colors text-sm"
                  disabled={isLoading}
                />
                <button
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || isLoading}
                  className="absolute right-2 top-2 bottom-2 p-2 text-zero-primary hover:bg-zero-primary/10 rounded-lg transition-colors disabled:opacity-50"
                >
                  <Send size={18} />
                </button>
              </div>
              <div className="text-center mt-2 text-[10px] text-muted-foreground">
                Zero Core v1.1 • File Transfer Protocol Active
              </div>
            </div>
          </div>
        </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
