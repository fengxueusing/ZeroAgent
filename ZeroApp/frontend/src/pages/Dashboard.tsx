import { Activity, Database, Film, TrendingUp } from 'lucide-react';

const stats = [
  { label: 'Active Agents', value: '12', icon: Activity, color: 'text-zero-primary' },
  { label: 'Videos Generated', value: '843', icon: Film, color: 'text-zero-secondary' },
  { label: 'Knowledge Nodes', value: '2.4k', icon: Database, color: 'text-emerald-400' },
  { label: 'Engagement Rate', value: '+24%', icon: TrendingUp, color: 'text-zero-accent' },
];

export function Dashboard() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-foreground mb-2">Dashboard</h2>
        <p className="text-muted-foreground">Welcome back, Operator. System is optimal.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="p-6 rounded-xl bg-zero-card border border-zero-border backdrop-blur-sm hover:border-muted transition-colors">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-2 rounded-lg bg-zero-border/50 ${stat.color}`}>
                <stat.icon size={20} />
              </div>
              <span className="text-xs font-mono text-muted-foreground bg-zero-border px-2 py-1 rounded">24H</span>
            </div>
            <div className="text-3xl font-bold text-foreground mb-1">{stat.value}</div>
            <div className="text-sm text-muted-foreground">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Activity Feed */}
        <div className="lg:col-span-2 p-6 rounded-xl bg-zero-card border border-zero-border">
          <h3 className="text-lg font-medium text-foreground mb-6">System Log</h3>
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4">
                <div className="mt-1 w-2 h-2 rounded-full bg-zero-primary ring-4 ring-zero-primary/10" />
                <div>
                  <div className="text-sm text-foreground">Agent Zero completed task <span className="text-zero-primary font-mono">#TK-88{i}</span></div>
                  <div className="text-xs text-muted-foreground mt-1">Generated 3 short videos about "Cyberpunk Aesthetics"</div>
                </div>
                <div className="ml-auto text-xs font-mono text-muted-foreground">0{i}:42 PM</div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="p-6 rounded-xl bg-zero-card border border-zero-border">
          <h3 className="text-lg font-medium text-foreground mb-6">Quick Actions</h3>
          <div className="space-y-3">
            <button className="w-full py-3 px-4 bg-zero-primary/10 hover:bg-zero-primary/20 text-zero-primary border border-zero-primary/50 rounded-lg transition-all font-medium flex items-center justify-center gap-2">
              <Film size={18} />
              New Project
            </button>
            <button className="w-full py-3 px-4 bg-zero-border hover:bg-muted/20 text-foreground border border-zero-border rounded-lg transition-all font-medium flex items-center justify-center gap-2">
              <Database size={18} />
              Update Knowledge
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
