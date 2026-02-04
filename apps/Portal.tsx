
import React from 'react';
import { Database, Server, Globe, Shield, Layout, Settings, AlertCircle, ChevronRight, Bell, Zap, Cloud, Cpu } from 'lucide-react';
import { AppType, Announcement } from '../types';

interface PortalProps {
  onSelectApp: (app: AppType) => void;
  announcements: Announcement[];
}

const Portal: React.FC<PortalProps> = ({ onSelectApp, announcements }) => {
  const apps = [
    { id: AppType.DATABASE_MANAGER, name: 'DB 云管平台', desc: 'JDBC 连接管理、全量敏感词扫描、AI 自动化巡检日报', icon: <Database className="w-8 h-8 text-blue-600" />, color: 'bg-blue-50', border: 'border-blue-100' },
    { id: AppType.SERVER_MANAGER, name: 'IT 资产系统', desc: '全网 CMDB、服务器生命周期追踪、多云主机纳管与审计', icon: <Server className="w-8 h-8 text-indigo-600" />, color: 'bg-indigo-50', border: 'border-indigo-100' },
    { id: AppType.NETWORK_MANAGER, name: '流量监控中心', desc: '全链路拓扑发现、实时流量分析、边界防火墙规则审计', icon: <Globe className="w-8 h-8 text-emerald-600" />, color: 'bg-emerald-50', border: 'border-emerald-100' },
    { id: AppType.PORTAL, name: '安全合规平台', desc: '基线合规性检查、系统漏洞定期扫描、零信任准入管理', icon: <Shield className="w-8 h-8 text-amber-600" />, color: 'bg-amber-50', border: 'border-amber-100' },
  ];

  return (
    <div className="max-w-7xl mx-auto p-12">
      {/* Hero Welcome */}
      <div className="mb-16 bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm flex items-center justify-between">
         <div>
            <h1 className="text-4xl font-black text-slate-800 mb-3">早安，王工</h1>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-sm flex items-center">
               <Cloud className="w-4 h-4 mr-2 text-blue-500" /> 
               当前平台共运行 1,248 个容器实例，系统负载 12.5%
            </p>
         </div>
         <div className="flex space-x-4">
            <div className="text-right">
               <p className="text-2xl font-black text-slate-800">24.5 °C</p>
               <p className="text-xs font-bold text-slate-400 uppercase">核心机房温度</p>
            </div>
            <div className="w-px h-10 bg-slate-100"></div>
            <div className="text-right">
               <p className="text-2xl font-black text-emerald-500">Normal</p>
               <p className="text-xs font-bold text-slate-400 uppercase">网络链路状态</p>
            </div>
         </div>
      </div>

      {/* Announcements */}
      <section className="mb-16">
        <div className="flex items-center justify-between mb-8 px-2">
          <h2 className="text-2xl font-black text-slate-800 flex items-center uppercase tracking-tight">
            <Zap className="w-6 h-6 mr-3 text-amber-500" />
            系统公告
          </h2>
          <button className="text-sm font-bold text-blue-600 hover:underline">更多动态</button>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {announcements.map((ann) => (
            <div key={ann.id} className="group bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-start space-x-5 hover:border-blue-400 hover:shadow-xl transition-all duration-300">
              <div className={`p-4 rounded-2xl shrink-0 ${ann.priority === 'high' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'} group-hover:scale-110 transition-transform`}>
                <Bell className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 py-0.5 bg-slate-50 rounded">{ann.app}</span>
                  <span className="text-xs font-bold text-slate-400">{ann.date}</span>
                </div>
                <h3 className="text-lg font-black text-slate-800 mb-2">{ann.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed line-clamp-2">{ann.content}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* App Grid */}
      <section>
        <h2 className="text-2xl font-black text-slate-800 mb-10 px-2 uppercase tracking-tight">子应用工作台</h2>
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {apps.map((app) => (
            <div 
              key={app.id} 
              onClick={() => onSelectApp(app.id)}
              className="group cursor-pointer bg-white rounded-[40px] border border-slate-100 p-8 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 relative overflow-hidden"
            >
              <div className="absolute -top-10 -right-10 p-12 opacity-[0.03] group-hover:opacity-10 group-hover:scale-150 transition-all duration-700 transform rotate-12">
                {app.icon}
              </div>
              
              <div className={`w-16 h-16 ${app.color} rounded-[24px] flex items-center justify-center mb-10 group-hover:scale-110 transition-transform duration-500`}>
                {/* Fixed: Added <any> to ReactElement cast to avoid "className does not exist" TS error */}
                {React.cloneElement(app.icon as React.ReactElement<any>, { className: 'w-8 h-8' })}
              </div>
              
              <h3 className="text-xl font-black text-slate-800 mb-3 group-hover:text-blue-600 transition-colors">{app.name}</h3>
              <p className="text-slate-400 text-sm font-medium leading-relaxed mb-8">
                {app.desc}
              </p>
              
              <div className="flex items-center text-blue-600 text-sm font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                进入系统 <ChevronRight className="w-4 h-4 ml-1" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom Status */}
      <footer className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { icon: <Cpu className="w-5 h-5" />, label: '集群核心数', val: '512 Core' },
          { icon: <Cloud className="w-5 h-5" />, label: '存储已用', val: '12.4 TB' },
          { icon: <Layout className="w-5 h-5" />, label: '活跃终端', val: '1,052 Nodes' },
        ].map((item, i) => (
          <div key={i} className="flex items-center space-x-4 px-6 py-4 bg-slate-50 rounded-2xl border border-slate-100">
             <div className="text-slate-400">{item.icon}</div>
             <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.label}</p>
                <p className="text-lg font-black text-slate-800">{item.val}</p>
             </div>
          </div>
        ))}
      </footer>
    </div>
  );
};

export default Portal;
