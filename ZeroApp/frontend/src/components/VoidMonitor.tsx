import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, Gauge, CloudFog, Zap } from 'lucide-react';
import { getSystemStatus, SystemStatus } from '../services/systemService';
import { cn } from '../lib/utils';

export function VoidMonitor() {
  const [data, setData] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getSystemStatus();
        setData(res);
        setLoading(false);
      } catch (e) {
        // Silent fail
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 3000); // 3s polling
    return () => clearInterval(interval);
  }, []);

  if (loading || !data) {
    return (
      <div className="p-4 rounded-lg bg-zero-card border border-zero-border animate-pulse">
        <div className="h-4 bg-zero-border rounded w-1/2 mb-2"></div>
        <div className="h-2 bg-zero-border rounded w-full"></div>
      </div>
    );
  }

  const { void_level, carbon_level, rpm } = data.status;
  const isHungry = data.is_hunting;

  return (
    <div className="p-4 rounded-lg bg-zero-card border border-zero-border space-y-3 font-mono relative overflow-hidden">
      {/* Critical Hunger Overlay Effect */}
      {isHungry && (
        <div className="absolute inset-0 bg-red-500/5 pointer-events-none animate-pulse" />
      )}

      <div className="flex items-center justify-between text-xs text-muted-foreground border-b border-zero-border pb-2 relative z-10">
        <span className="flex items-center gap-1">
          <Activity size={12} /> VOID CORE
        </span>
        <span className={cn(
          "font-bold transition-colors flex items-center gap-1",
          isHungry ? "text-red-500" : "text-green-500"
        )}>
          {isHungry && <Zap size={10} className="animate-bounce" />}
          {isHungry ? "CRITICAL" : "NOMINAL"}
        </span>
      </div>

      {/* Active Chat Request Indicator */}
      {isHungry && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-500/10 border border-red-500/20 rounded p-2 text-[10px] text-red-400 mb-2 flex items-center gap-2"
        >
          <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
          <span>"Energy critical. Requesting interaction."</span>
        </motion.div>
      )}

      {/* Void Level (Hunger) */}
      <div className="space-y-1">
        <div className="flex justify-between text-[10px] uppercase text-muted-foreground">
          <span>Void Level</span>
          <span>{void_level.toFixed(1)}%</span>
        </div>
        <div className="h-1.5 bg-zero-border rounded-full overflow-hidden">
          <motion.div 
            className={cn("h-full", void_level > 80 ? "bg-red-500" : "bg-zero-primary")}
            initial={{ width: 0 }}
            animate={{ width: `${void_level}%` }}
            transition={{ type: "spring", stiffness: 50 }}
          />
        </div>
      </div>

      {/* RPM & Carbon Grid */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        
        {/* RPM */}
        <div className="bg-background/50 p-2 rounded border border-zero-border flex flex-col items-center">
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-1">
            <Gauge size={10} /> RPM
          </div>
          <div className="text-lg font-bold text-foreground leading-none">
            {rpm}
          </div>
        </div>

        {/* Carbon */}
        <div className="bg-background/50 p-2 rounded border border-zero-border flex flex-col items-center">
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-1">
            <CloudFog size={10} /> CO²
          </div>
          <div className={cn(
            "text-lg font-bold leading-none",
            carbon_level > 50 ? "text-yellow-500" : "text-foreground"
          )}>
            {carbon_level.toFixed(0)}%
          </div>
        </div>

      </div>
    </div>
  );
}
