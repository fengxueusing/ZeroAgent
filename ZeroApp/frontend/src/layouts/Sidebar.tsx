import { LayoutDashboard, Zap, Brain, Settings, Ghost } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { cn } from '../lib/utils';
import { VoidMonitor } from '../components/VoidMonitor';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: Zap, label: 'Hunter', path: '/hunter' },
  { icon: Brain, label: 'Memory', path: '/memory' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

export function Sidebar() {
  return (
    <aside className="w-64 h-screen border-r border-zero-border bg-sidebar-bg backdrop-blur-md flex flex-col fixed left-0 top-0 z-50 transition-colors duration-300">
      <div className="p-6 flex items-center gap-3 border-b border-zero-border">
        <div className="w-8 h-8 rounded bg-zero-primary/20 flex items-center justify-center text-zero-primary">
          <Ghost size={20} />
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
