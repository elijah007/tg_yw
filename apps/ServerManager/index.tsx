
import React, { useState, useEffect } from 'react';
import { 
  Server, Cpu, Activity, HardDrive, Search, Filter, 
  MoreVertical, CheckCircle, AlertCircle, Terminal, 
  Plus, RefreshCw, Layers, Shield, Globe
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';

const ServerManager: React.FC = () => {
  const [servers, setServers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    const fetchServers = async () => {
      try {
        const res = await fetch('/api/servers');
        const data = await res.json();
        if (data.success) setServers(data.data);
      } catch (e) {
        console.error("Failed to fetch CMDB data");
      } finally {
        setLoading(false);
      }
    };
    fetchServers();
  }, []);

  const stats = [
    { label: '纳管主机', value: servers.length, icon: <Server className="text-blue-500" /> },
    { label: '运行中', value: servers.filter(s => s.status === 'running').length, icon: <Activity className="text-emerald-500" /> },
    { label: '平均负载', value: '12.5%', icon: <Cpu className="text-amber-500" /> },
    { label: '存储池', value: '82%', icon: <HardDrive className="text-indigo-500" /> },
  ];

  const filteredServers = servers.filter(s => 
    s.hostname.toLowerCase().includes(filter.toLowerCase()) || 
    s.ip.includes(filter)
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tighter uppercase flex items-center">
            <Layers className="w-8 h-8 mr-3 text-indigo-600" />
            资产管理中心 (CMDB)
          </h1>
          <p className="text-slate-400 font-medium">统一纳管多云主机、物理机及容器节点</p>
        </div>
        <div className="flex space-x-3">
           <button className="flex items-center space-x-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95">
             <Plus className="w-5 h-5" />
             <span>导入资产</span>
           </button>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {stats.map((s, i) => (
          <div key={i} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center space-x-5">
            <div className="p-4 bg-slate-50 rounded-2xl">{s.icon}</div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.label}</p>
              <p className="text-2xl font-black text-slate-800">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Server Table */}
        <div className="lg:col-span-2 space-y-4">
           <div className="flex items-center space-x-4 mb-2">
              <div className="flex-1 relative">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                 <input 
                   type="text" 
                   placeholder="搜索主机名、IP地址..." 
                   className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-2xl outline-none focus:ring-4 ring-indigo-500/10 focus:border-indigo-500 font-bold transition-all shadow-sm"
                   value={filter}
                   onChange={e => setFilter(e.target.value)}
                 />
              </div>
              <button className="p-4 bg-white border border-slate-100 rounded-2xl text-slate-500 hover:text-indigo-600 shadow-sm"><Filter /></button>
           </div>

           <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
             <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">主机名 / 环境</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">内网 IP</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">配置</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">状态</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredServers.map(s => (
                    <tr key={s.id} className="group hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-5">
                        <div className="font-black text-slate-800 group-hover:text-indigo-600 transition-colors">{s.hostname}</div>
                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${s.env === 'prod' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'}`}>{s.env}</span>
                      </td>
                      <td className="px-6 py-5 font-mono text-sm text-slate-500">{s.ip}</td>
                      <td className="px-6 py-5 text-xs font-bold text-slate-400">
                         {s.cpu_cores}C / {s.memory_gb}G
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center space-x-2">
                           <span className={`w-2 h-2 rounded-full ${s.status === 'running' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></span>
                           <span className="text-[10px] font-black uppercase text-slate-500">{s.status === 'running' ? '在线' : '离线'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <button className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"><Terminal className="w-4 h-4" /></button>
                        <button className="p-2 text-slate-300 hover:text-slate-600 rounded-xl transition-all"><MoreVertical className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
             </table>
           </div>
        </div>

        {/* Resource View */}
        <div className="space-y-6">
           <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm h-full">
              <h3 className="font-black text-slate-800 mb-6 uppercase tracking-tighter flex items-center">
                 <Activity className="w-5 h-5 mr-2 text-emerald-500" />
                 实时告警流
              </h3>
              <div className="space-y-4">
                 {[
                   { msg: 'prod-db-master CPU 负载过高 (>85%)', time: '1分钟前', level: 'high' },
                   { msg: 'srv-03 内存使用率触及阈值', time: '5分钟前', level: 'medium' },
                   { msg: '资产扫描任务完成: 发现4台新设备', time: '1小时前', level: 'low' },
                 ].map((a, i) => (
                   <div key={i} className="p-4 bg-slate-50 rounded-2xl flex items-start space-x-3 group hover:bg-white hover:shadow-md transition-all border border-transparent hover:border-slate-100">
                      <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${a.level === 'high' ? 'bg-red-500' : a.level === 'medium' ? 'bg-amber-500' : 'bg-blue-500'}`}></div>
                      <div>
                         <p className="text-sm font-bold text-slate-700 leading-tight">{a.msg}</p>
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{a.time}</p>
                      </div>
                   </div>
                 ))}
              </div>
              
              <div className="mt-10 pt-10 border-t border-slate-100">
                 <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">操作系统分布</h4>
                 <div className="space-y-4">
                    {[
                      { name: 'CentOS 7.9', val: 12, color: 'bg-indigo-500' },
                      { name: 'Ubuntu 22.04', val: 8, color: 'bg-orange-500' },
                      { name: 'Debian 11', val: 3, color: 'bg-red-500' },
                    ].map((os, i) => (
                      <div key={i} className="flex items-center space-x-4">
                         <span className="w-24 text-[10px] font-black text-slate-600 truncate">{os.name}</span>
                         <div className="flex-1 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div className={`${os.color} h-full`} style={{ width: `${(os.val/23)*100}%` }}></div>
                         </div>
                         <span className="text-[10px] font-black text-slate-400 w-8 text-right">{os.val}</span>
                      </div>
                    ))}
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default ServerManager;
