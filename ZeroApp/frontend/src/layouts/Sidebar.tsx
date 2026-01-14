import { LayoutDashboard, Zap, Brain, Settings, Ghost } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { VoidMonitor } from '../components/VoidMonitor';
import { useState, useEffect } from 'react';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: Zap, label: 'Hunter', path: '/hunter' },
  { icon: Brain, label: 'Memory', path: '/memory' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

export function Sidebar() {
  const navigate = useNavigate();
  const [avatarTimestamp, setAvatarTimestamp] = useState(Date.now());
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    const handleUpdate = () => {
       setAvatarTimestamp(Date.now());
       setImgError(false);
    };
    window.addEventListener('avatar-updated', handleUpdate);
    return () => window.removeEventListener('avatar-updated', handleUpdate);
  }, []);

  return (
    <aside className="w-64 h-screen border-r border-zero-border bg-sidebar-bg backdrop-blur-md flex flex-col fixed left-0 top-0 z-50 transition-colors duration-300">
      <div 
        className="p-6 flex items-center gap-3 border-b border-zero-border cursor-pointer hover:bg-white/5 transition-colors group"
        onClick={() => navigate('/settings')}
        title="Go to Settings to configure Avatar"
      >
        <div className="w-8 h-8 rounded bg-zero-primary/20 flex items-center justify-center text-zero-primary overflow-hidden relative">
          {!imgError ? (
             <img 
               src={`http://localhost:8000/static/avatar.png?t=${avatarTimestamp}`}
               onError={() => setImgError(true)}
               alt="Avatar"
               className="w-full h-full object-cover"
             />
          ) : (
             <Ghost size={20} />
          )}
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Settings size={12} className="text-white" />
          </div>
        </div>
        <h1 className="font-bold text-xl tracking-wider text-foreground">ZERO<span className="text-zero-primary">.APP</span></h1>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 group",
                isActive
                  ? "bg-zero-primary/10 text-zero-primary border border-zero-primary/20 shadow-[0_0_15px_rgba(0,240,255,0.1)]"
                  : "text-muted-foreground hover:text-foreground hover:bg-zero-border/50"
              )
            }
          >
            <item.icon size={20} />
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-zero-border">
        <VoidMonitor />
      </div>
    </aside>
  );
}
