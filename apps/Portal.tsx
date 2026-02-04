
import React, { useState, useEffect } from 'react';
import { 
  Database, Server, Globe, Shield, Layout, Settings, 
  AlertCircle, ChevronRight, Bell, Zap, Cloud, Cpu, RefreshCw, AlertTriangle, Terminal
} from 'lucide-react';
import { AppType } from '../types';

interface PortalProps {
  onSelectApp: (app: AppType) => void;
}

const ICON_MAP: Record<string, any> = {
  Database, 
  Server, 
  Globe, 
  Shield, 
  Layout, 
  Settings,
  Terminal // 对应日志中心
};

const Portal: React.FC<PortalProps> = ({ onSelectApp }) => {
  const [apps, setApps] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPortalData = async () => {
      try {
        const res = await fetch('/api/portal/data');
        const data = await res.json();
        if (data.success) {
          setApps(data.apps);
          setAnnouncements(data.announcements || []);
        } else {
          setError(data.error);
        }
      } catch (err) {
        setError('无法连接到中枢服务器 (DATABASE_OFFLINE)');
      } finally {
        setLoading(false);
      }
    };
    fetchPortalData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <RefreshCw className="w-12 h-12 text-blue-500 animate-spin mb-4" />
        <p className="text-slate-400 font-black uppercase tracking-widest text-sm">正在加载中枢元数据...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto mt-20 p-10 bg-white rounded-[40px] border border-red-100 shadow-2xl text-center">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-10 h-10 text-red-500" />
        </div>
        <h2 className="text-2xl font-black text-slate-800 mb-2">连接元数据库失败</h2>
        <p className="text-slate-500 mb-8 font-medium">错误详情: {error}</p>
        <p className="text-[10px] text-slate-400 mb-6 uppercase tracking-widest">请确认 MySQL 是否在 192.168.21.60 运行</p>
        <button onClick={() => window.location.reload()} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black">重试连接</button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-12 animate-in fade-in duration-700">
      <div className="mb-16 bg-white p-12 rounded-[48px] border border-slate-100 shadow-sm flex items-center justify-between relative overflow-hidden group">
         <div className="absolute top-0 left-0 w-2 h-full bg-blue-600"></div>
         <div className="relative z-10">
            <h1 className="text-5xl font-black text-slate-800 mb-4 tracking-tighter">天工中枢门户</h1>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-sm flex items-center">
               <Cloud className="w-4 h-4 mr-3 text-blue-500" /> 
               集群元数据已就绪，当前负载处于健康阈值 (12.5%)
            </p>
         </div>
         <div className="flex space-x-10 relative z-10">
            <div className="text-right">
               <p className="text-3xl font-black text-slate-800">24.5°C</p>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">核心机房温度</p>
            </div>
            <div className="text-right">
               <p className="text-3xl font-black text-emerald-500">Normal</p>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">网络链路拨测</p>
            </div>
         </div>
      </div>

      <section>
        <h2 className="text-3xl font-black text-slate-800 mb-12 px-4 uppercase tracking-tighter flex items-center">
           <Layout className="w-8 h-8 mr-4 text-blue-600" />
           子应用工作台
        </h2>
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {apps.map((app) => {
            const IconComp = ICON_MAP[app.icon_type] || Database;
            return (
              <div 
                key={app.id} 
                onClick={() => onSelectApp(app.id as AppType)}
                className="group cursor-pointer bg-white rounded-[48px] border border-slate-100 p-10 shadow-sm hover:shadow-2xl hover:-translate-y-3 transition-all duration-500 relative overflow-hidden"
              >
                <div className={`w-20 h-20 bg-${app.color_theme}-50 rounded-[32px] flex items-center justify-center mb-10 group-hover:scale-110 transition-transform duration-500`}>
                   <IconComp className={`w-10 h-10 text-${app.color_theme}-600`} />
                </div>
                
                <h3 className="text-2xl font-black text-slate-800 mb-4 group-hover:text-blue-600 transition-colors">{app.name}</h3>
                <p className="text-slate-400 text-sm font-medium leading-relaxed mb-10">
                  {app.description}
                </p>
                
                <div className="flex items-center text-blue-600 text-xs font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                  进入系统 <ChevronRight className="w-4 h-4 ml-1" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <footer className="mt-32 pt-16 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-12">
        {[
          { icon: <Cpu className="w-6 h-6" />, label: '集群计算核心', val: '512 vCPU' },
          { icon: <Cloud className="w-6 h-6" />, label: '存储池已用', val: '12.4 / 100 TB' },
          { icon: <Layout className="w-6 h-6" />, label: '在线终端节点', val: '1,052 Nodes' },
        ].map((item, i) => (
          <div key={i} className="flex items-center space-x-5 px-8 py-6 bg-slate-50/50 rounded-3xl border border-slate-100/50">
             <div className="text-slate-400">{item.icon}</div>
             <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.label}</p>
                <p className="text-2xl font-black text-slate-800 tracking-tighter">{item.val}</p>
             </div>
          </div>
        ))}
      </footer>
    </div>
  );
};

export default Portal;
