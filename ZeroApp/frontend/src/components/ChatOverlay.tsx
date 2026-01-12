import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Cpu, Activity, Zap, Maximize2, Minimize2, Paperclip, FileIcon, ImageIcon } from 'lucide-react';
import { cn } from '../lib/utils';
import api from '../lib/api';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  meta?: {
    reaction?: string;
    voidLevel?: number;
    file?: {
      name: string;
      type: string;
    };
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

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isExpanded]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await api.post('/chat/send', {
        message: userMsg.content,
        fuel_type: "daily_chat"
      });

      const data = res.data;
      
      if (data.current_status) {
        setEngineStatus(data.current_status);
      }

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.agent_response || data.engine_reaction,
        timestamp: new Date(),
        meta: {
          reaction: data.engine_reaction,
          voidLevel: data.current_status?.void_level
        }
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Error: Connection to Void Engine lost.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: `Uploading file: ${file.name}...`,
      timestamp: new Date(),
      meta: {
        file: {
          name: file.name,
          type: file.type
        }
      }
    };
    
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('/chat/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const data = res.data;
      if (data.current_status) {
        setEngineStatus(data.current_status);
      }

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `File received: ${data.filename}. ${data.engine_reaction}`,
        timestamp: new Date(),
        meta: {
          reaction: data.engine_reaction,
          voidLevel: data.current_status?.void_level
        }
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Error: File upload failed.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
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
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span>Connected</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
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

            {/* Chat Area */}
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
                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                    msg.role === 'user' ? "bg-zero-border" : "bg-zero-primary/20 text-zero-primary"
                  )}>
                    {msg.role === 'user' ? <div className="w-2 h-2 bg-foreground rounded-full" /> : <Cpu size={16} />}
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
                    {msg.content}
                    {msg.meta?.voidLevel !== undefined && (
                      <div className="mt-2 pt-2 border-t border-zero-border/50 text-[10px] font-mono text-muted-foreground flex justify-between">
                        <span>VOID_LEVEL_UPDATE</span>
                        <span>{msg.meta.voidLevel}%</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex gap-3">
                   <div className="w-8 h-8 rounded-full bg-zero-primary/20 flex items-center justify-center shrink-0 text-zero-primary">
                    <Cpu size={16} />
                  </div>
                  <div className="bg-zero-card border border-zero-border px-4 py-3 rounded-2xl rounded-tl-none">
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 bg-zero-primary/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 bg-zero-primary/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 bg-zero-primary/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-background border-t border-zero-border">
              <div className="relative flex gap-2">
                <input 
                  type="file" 
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-3 text-muted-foreground hover:text-foreground hover:bg-zero-border rounded-xl transition-colors"
                  title="Upload File"
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
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
