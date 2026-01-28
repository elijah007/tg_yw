
import React from 'react';
import { Database, Server, Globe, Shield, Layout, Settings, AlertCircle, ChevronRight, Bell } from 'lucide-react';
import { AppType, Announcement } from '../types';

interface PortalProps {
  onSelectApp: (app: AppType) => void;
  announcements: Announcement[];
}

const Portal: React.FC<PortalProps> = ({ onSelectApp, announcements }) => {
  const apps = [
    { id: AppType.DATABASE_MANAGER, name: '数据库管理平台', desc: 'JDBC连接、全量/增量敏感词扫描、自动化巡检', icon: <Database className="w-8 h-8 text-blue-500" />, color: 'bg-blue-50' },
    { id: AppType.SERVER_MANAGER, name: '资产管理系统', desc: '全网CMDB、服务器生命周期、SSH审计', icon: <Server className="w-8 h-8 text-indigo-500" />, color: 'bg-indigo-50' },
    { id: AppType.NETWORK_MANAGER, name: '网络监控中心', desc: '拓扑发现、流量分析、边界防火墙审计', icon: <Globe className="w-8 h-8 text-emerald-500" />, color: 'bg-emerald-50' },
    { id: AppType.PORTAL, name: '安全审计平台', desc: '合规性检查、漏洞扫描、准入管理', icon: <Shield className="w-8 h-8 text-amber-500" />, color: 'bg-amber-50' },
  ];

  return (
    <div className="max-w-7xl mx-auto p-8">
      {/* Announcements */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-800 flex items-center">
            <AlertCircle className="w-5 h-5 mr-2 text-blue-500" />
            平台公告
          </h2>
          <button className="text-sm text-blue-600 hover:underline">查看全部</button>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {announcements.map((ann) => (
            <div key={ann.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-start space-x-4 hover:border-blue-300 transition-colors">
              <div className={`p-2 rounded-lg ${ann.priority === 'high' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'}`}>
                <Bell className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{ann.app}</span>
                  <span className="text-xs text-slate-400">{ann.date}</span>
                </div>
                <h3 className="font-semibold text-slate-800 mb-1">{ann.title}</h3>
                <p className="text-sm text-slate-600 line-clamp-1">{ann.content}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* App Grid */}
      <section>
        <h2 className="text-2xl font-bold text-slate-800 mb-8">子应用工作台</h2>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {apps.map((app) => (
            <div 
              key={app.id} 
              onClick={() => onSelectApp(app.id)}
              className="group cursor-pointer bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transform group-hover:scale-150 transition-all">
                {app.icon}
              </div>
              
              <div className={`w-14 h-14 ${app.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                {app.icon}
              </div>
              
              <h3 className="text-lg font-bold text-slate-800 mb-2 group-hover:text-blue-600 transition-colors">{app.name}</h3>
              <p className="text-slate-500 text-sm leading-relaxed mb-6">
                {app.desc}
              </p>
              
              <div className="flex items-center text-blue-600 text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                进入系统 <ChevronRight className="w-4 h-4 ml-1" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Quick Stats */}
      <section className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <Layout className="w-6 h-6 opacity-80" />
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">系统健康</span>
          </div>
          <p className="text-3xl font-bold mb-1">99.98%</p>
          <p className="text-sm opacity-80">当前平台运行稳定性</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <Shield className="w-6 h-6 text-emerald-500" />
            <span className="text-xs text-slate-400">本月拦截</span>
          </div>
          <p className="text-3xl font-bold text-slate-800 mb-1">1,284</p>
          <p className="text-sm text-slate-500">高危安全访问请求已拦截</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <Settings className="w-6 h-6 text-slate-400" />
            <span className="text-xs text-slate-400">活跃用户</span>
          </div>
          <p className="text-3xl font-bold text-slate-800 mb-1">42</p>
          <p className="text-sm text-slate-500">当前在线运维工程师</p>
        </div>
      </section>
    </div>
  );
};

export default Portal;
