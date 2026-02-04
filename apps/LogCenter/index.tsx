
import React, { useState, useEffect, useRef } from 'react';
import { 
  Terminal, Search, Filter, RefreshCw, Trash2, 
  Download, Play, Pause, AlertCircle, Info, Bug, ShieldAlert 
} from 'lucide-react';
import { LogEntry } from '../../types';

const LogCenter: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(true);
  const [filterLevel, setFilterLevel] = useState<string>('');
  const logEndRef = useRef<HTMLDivElement>(null);

  const fetchLogs = async () => {
    try {
      const res = await fetch(`/api/logs?${filterLevel ? `level=${filterLevel}` : ''}`);
      const data = await res.json();
      if (data.success) setLogs(data.data);
    } catch (e) {
      console.error("Fetch logs failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    let interval: any;
    if (isLive) {
      interval = setInterval(fetchLogs, 3000);
    }
    return () => clearInterval(interval);
  }, [isLive, filterLevel]);

  const getLevelStyle = (level: string) => {
    switch(level) {
      case 'ERROR': return 'text-red-400 bg-red-400/10 border-red-400/20';
      case 'WARN': return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
      case 'DEBUG': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      default: return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
    }
  };

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col bg-slate-950 text-slate-300 font-mono">
      {/* Log Header / Toolbar */}
      <div className="p-4 bg-slate-900/50 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <Terminal className="w-5 h-5 text-indigo-400" />
            <h2 className="text-sm font-black uppercase tracking-widest text-white">Centralized System Logs</h2>
          </div>
          <div className="h-4 w-px bg-white/10"></div>
          <div className="flex items-center space-x-2 bg-slate-800/50 rounded-lg px-3 py-1.5 border border-white/5">
             <Filter className="w-3.5 h-3.5 text-slate-500" />
             <select 
               className="bg-transparent border-none outline-none text-xs font-bold text-slate-400"
               value={filterLevel}
               onChange={(e) => setFilterLevel(e.target.value)}
             >
               <option value="">ALL LEVELS</option>
               <option value="INFO">INFO</option>
               <option value="WARN">WARN</option>
               <option value="ERROR">ERROR</option>
               <option value="DEBUG">DEBUG</option>
             </select>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setIsLive(!isLive)}
            className={`flex items-center space-x-2 px-4 py-1.5 rounded-lg text-xs font-black transition-all ${isLive ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-slate-800 text-slate-400 border border-white/5'}`}
          >
            {isLive ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
            <span>{isLive ? 'LIVE STREAMING' : 'PAUSED'}</span>
          </button>
          <button className="p-2 hover:bg-white/5 rounded-lg text-slate-500 hover:text-white transition-colors"><Download className="w-4 h-4" /></button>
          <button className="p-2 hover:bg-white/5 rounded-lg text-slate-500 hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
        </div>
      </div>

      {/* Log Content Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-2 custom-scrollbar">
        {loading ? (
          <div className="flex items-center justify-center h-full text-slate-600 animate-pulse">
            Establishing secure log channel...
          </div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="flex items-start space-x-4 group hover:bg-white/5 py-1 px-2 rounded-md transition-colors border-l-2 border-transparent hover:border-indigo-500">
               <span className="text-slate-600 shrink-0 text-[11px] mt-0.5">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
               <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${getLevelStyle(log.level)} shrink-0 w-16 text-center`}>
                 {log.level}
               </span>
               <span className="text-indigo-400/80 font-bold text-[11px] shrink-0 w-24">@{log.module}</span>
               <span className="text-slate-200 text-sm font-medium whitespace-pre-wrap leading-relaxed">{log.message}</span>
            </div>
          ))
        )}
        <div ref={logEndRef} />
      </div>

      {/* Footer Info */}
      <div className="px-6 py-2 bg-indigo-600 text-white text-[10px] font-black flex justify-between items-center uppercase tracking-widest">
         <div className="flex items-center space-x-4">
            <span>Server: Cluster-Nexus-01</span>
            <span>Latency: 12ms</span>
         </div>
         <div className="flex items-center space-x-4">
            <span>Buffer: {logs.length}/500</span>
            <span className="bg-white/20 px-2 py-0.5 rounded">v2.8.5-CORE</span>
         </div>
      </div>
    </div>
  );
};

export default LogCenter;
