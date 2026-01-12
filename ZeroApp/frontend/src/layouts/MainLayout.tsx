import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Bell, Search, Sun, Moon, MessageSquare } from 'lucide-react';
import { useTheme } from '../components/theme-provider';
import { useState } from 'react';
import { ChatOverlay } from '../components/ChatOverlay';

export function MainLayout() {
  const { setTheme, theme } = useTheme();
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <div className="min-h-screen bg-transparent transition-colors duration-300">
      <Sidebar />
      <ChatOverlay isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
      
      <main className="pl-64 min-h-screen flex flex-col">
        {/* Header */}
        <header className="h-16 border-b border-zero-border bg-header-bg backdrop-blur-sm sticky top-0 z-40 flex items-center justify-between px-8 transition-colors duration-300">
          <div className="flex items-center gap-4 text-muted-foreground">
            <Search size={18} />
            <input 
              type="text" 
              placeholder="Execute command..." 
              className="bg-transparent border-none outline-none text-sm w-64 text-foreground placeholder-muted-foreground focus:placeholder-foreground"
            />
          </div>
          
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setIsChatOpen(true)}
              className="p-2 bg-zero-primary/10 text-zero-primary rounded-lg hover:bg-zero-primary/20 transition-all flex items-center gap-2 text-sm font-medium"
            >
              <MessageSquare size={18} />
              <span>Zero Core</span>
            </button>

            <button 
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            
            <button className="relative text-muted-foreground hover:text-foreground transition-colors">
              <Bell size={20} />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-zero-accent rounded-full animate-ping" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-zero-accent rounded-full" />
            </button>
            <div className="flex items-center gap-3 pl-6 border-l border-zero-border">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-zero-primary to-zero-secondary" />
              <div className="text-sm">
                <div className="font-medium text-foreground">Yan Tianxue</div>
                <div className="text-xs text-muted-foreground">Administrator</div>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 p-8 overflow-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
