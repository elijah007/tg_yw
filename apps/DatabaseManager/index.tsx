
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Database, Shield, Activity, Settings, 
  Search, Plus, RefreshCw, Trash2, CheckCircle, XCircle, 
  Database as DbIcon, ShieldCheck, AlertTriangle, Play, X,
  ArrowUpRight, BarChart3, HardDrive, Layers
} from 'lucide-react';
import { DataSource, SensitiveRule, InspectionRecord, DatabaseType } from '../../types';
import { INITIAL_DATA_SOURCES, INITIAL_RULES } from '../../constants';
import DataSourceModal from './DataSourceModal';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from 'recharts';

const DatabaseManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'sources' | 'sensitive' | 'inspection' | 'profile'>('dashboard');
  const [sources, setSources] = useState<DataSource[]>(INITIAL_DATA_SOURCES);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingSource, setEditingSource] = useState<DataSource | null>(null);
  const [sourceToDelete, setSourceToDelete] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<Record<string, 'success' | 'error' | 'loading' | null>>({});

  const handleTestConnection = async (id: string) => {
    setTestResult(prev => ({ ...prev, [id]: 'loading' }));
    await new Promise(resolve => setTimeout(resolve, 1500));
    const success = Math.random() > 0.2;
    setTestResult(prev => ({ ...prev, [id]: success ? 'success' : 'error' }));
  };

  const confirmDelete = () => {
    if (sourceToDelete) {
      setSources(prev => prev.filter(s => s.id !== sourceToDelete));
      setSourceToDelete(null);
      setIsDeleteModalOpen(false);
    }
  };

  const chartData = [
    { time: '00:00', load: 12, connections: 45 },
    { time: '04:00', load: 8, connections: 32 },
    { time: '08:00', load: 45, connections: 120 },
    { time: '12:00', load: 60, connections: 250 },
    { time: '16:00', load: 55, connections: 210 },
    { time: '20:00', load: 30, connections: 95 },
  ];

  const incrementData = [
    { date: '10-20', inc: 2.4 },
    { date: '10-21', inc: 3.1 },
    { date: '10-22', inc: 4.8 },
    { date: '10-23', inc: 4.2 },
    { date: '10-24', inc: 5.5 },
    { date: '10-25', inc: 4.9 },
    { date: '今日', inc: 6.2 },
  ];

  const largeTables = [
    { name: 'order_details', db: 'order_db', rows: '4.2亿', size: '124.5 GB', type: 'MySQL', risk: 'high' },
    { name: 'user_action_logs', db: 'logs', rows: '12亿', size: '89.2 GB', type: 'Mongo', risk: 'medium' },
    { name: 'audit_trail', db: 'core_db', rows: '1.5亿', size: '45.1 GB', type: 'PG', risk: 'low' },
    { name: 'billing_snapshot', db: 'finance', rows: '8,400万', size: '32.8 GB', type: 'MySQL', risk: 'low' },
  ];

  return (
    <div className="flex h-full min-h-[calc(100vh-64px)]">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-white border-r border-slate-200 p-6 flex flex-col">
        <nav className="space-y-2 flex-1">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'dashboard' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="font-medium">概览大屏</span>
          </button>
          <button 
            onClick={() => setActiveTab('sources')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'sources' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <DbIcon className="w-5 h-5" />
            <span className="font-medium">数据源管理</span>
          </button>
          <button 
            onClick={() => setActiveTab('sensitive')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'sensitive' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <Shield className="w-5 h-5" />
            <span className="font-medium">敏感数据发现</span>
          </button>
          <button 
            onClick={() => setActiveTab('inspection')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'inspection' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <Activity className="w-5 h-5" />
            <span className="font-medium">日常巡检</span>
          </button>
        </nav>

        <div className="pt-6 border-t border-slate-100">
           <button 
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'profile' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <Settings className="w-5 h-5" />
            <span className="font-medium">个人配置</span>
          </button>
        </div>
      </aside>

      {/* Content Area */}
      <div className="flex-1 p-8 bg-slate-50 overflow-y-auto">
        {activeTab === 'dashboard' && (
          /* Dashboard 保持不变，仅更新统计数据关联 */
          <div className="space-y-8 animate-in fade-in duration-500">
             <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">数据库运行概览</h2>
                <p className="text-slate-500">实时监控集群状态与安全指标</p>
              </div>
              <div className="flex space-x-2">
                 <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse"></div>
                  所有实例在线
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { label: '连接实例', val: sources.length, icon: <DbIcon />, color: 'text-blue-600', bg: 'bg-blue-50', link: 'sources' },
                { label: '敏感字段', val: '128', icon: <ShieldCheck />, color: 'text-amber-600', bg: 'bg-amber-50', link: 'sensitive' },
                { label: '昨日巡检', val: '通过', icon: <CheckCircle />, color: 'text-emerald-600', bg: 'bg-emerald-50', link: 'inspection' },
                { label: '预警事件', val: '0', icon: <AlertTriangle />, color: 'text-slate-400', bg: 'bg-slate-50', link: 'inspection' },
              ].map((stat, i) => (
                <div 
                  key={i} 
                  onClick={() => setActiveTab(stat.link as any)}
                  className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm cursor-pointer hover:shadow-md transition-all group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className={`p-2 rounded-lg ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform`}>
                      {stat.icon}
                    </div>
                    <span className="text-xs text-slate-400 font-medium">实时</span>
                  </div>
                  <p className="text-sm text-slate-500 font-medium">{stat.label}</p>
                  <p className={`text-2xl font-bold ${stat.color}`}>{stat.val}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 mb-6">全网负载趋势 (JDBC Active Connections)</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorLoad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="time" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      />
                      <Area type="monotone" dataKey="connections" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorLoad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                 <h3 className="text-lg font-bold text-slate-800 mb-4">待办事项</h3>
                 <div className="space-y-4">
                    {[
                      { task: '全量扫描生产库-核心-01', type: 'SCAN' },
                      { task: '更新Mongo备份计划', type: 'CONFIG' },
                      { task: '修复PG主从延迟预警', type: 'ALERT' }
                    ].map((item, i) => (
                      <div key={i} className="flex items-center p-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-blue-200 transition-colors">
                        <div className={`w-2 h-2 rounded-full mr-3 ${item.type === 'ALERT' ? 'bg-red-500' : 'bg-blue-500'}`}></div>
                        <span className="text-sm text-slate-700 font-medium">{item.task}</span>
                      </div>
                    ))}
                 </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'sources' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">数据源管理</h2>
                <p className="text-slate-500">管理所有的 JDBC 连接配置</p>
              </div>
              <button 
                onClick={() => { setEditingSource(null); setIsModalOpen(true); }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl flex items-center shadow-lg shadow-blue-100 transition-all active:scale-95"
              >
                <Plus className="w-4 h-4 mr-2" /> 新增数据源
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-sm font-semibold text-slate-600">实例名称</th>
                    <th className="px-6 py-4 text-sm font-semibold text-slate-600">数据库类型</th>
                    <th className="px-6 py-4 text-sm font-semibold text-slate-600">地址</th>
                    <th className="px-6 py-4 text-sm font-semibold text-slate-600">状态</th>
                    <th className="px-6 py-4 text-sm font-semibold text-slate-600">最后扫描</th>
                    <th className="px-6 py-4 text-sm font-semibold text-slate-600 text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sources.map((source) => (
                    <tr key={source.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-800">{source.name}</div>
                        <div className="text-xs text-slate-400">{source.database}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="uppercase text-xs font-bold px-2 py-1 bg-slate-100 rounded text-slate-600">
                          {source.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {source.host}:{source.port}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                           {testResult[source.id] === 'loading' ? (
                             <RefreshCw className="w-4 h-4 text-blue-500 animate-spin mr-2" />
                           ) : testResult[source.id] === 'success' ? (
                             <CheckCircle className="w-4 h-4 text-emerald-500 mr-2" />
                           ) : testResult[source.id] === 'error' ? (
                             <XCircle className="w-4 h-4 text-red-500 mr-2" />
                           ) : (
                             <div className={`w-2 h-2 rounded-full mr-2 ${source.status === 'online' ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                           )}
                           <span className="text-sm font-medium">{source.status === 'online' ? '正常' : '离线'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500 italic">
                        {source.lastScanned || '未曾扫描'}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button 
                          onClick={() => handleTestConnection(source.id)}
                          title="测试连接"
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => { setEditingSource(source); setIsModalOpen(true); }}
                          title="编辑配置"
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        >
                          <Settings className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => { setSourceToDelete(source.id); setIsDeleteModalOpen(true); }}
                          title="删除"
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'sensitive' && (
           /* 保持现状 */
           <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
             <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">敏感数据扫描</h2>
                  <p className="text-slate-500">自定义扫描策略，发现隐藏的数据风险</p>
                </div>
                <div className="flex space-x-3">
                   <button className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-white">
                      管理规则库
                   </button>
                   <button className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center shadow-lg shadow-blue-100">
                      <Play className="w-4 h-4 mr-2" /> 发起全局扫描
                   </button>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center space-y-4">
                   <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center">
                      <Plus className="w-8 h-8" />
                   </div>
                   <h3 className="font-bold text-slate-800 text-lg">全量扫描任务</h3>
                   <p className="text-sm text-slate-500">对选定的实例内所有非系统库进行完整字典匹配</p>
                   <button className="text-blue-600 font-semibold hover:underline">去创建 &rarr;</button>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center space-y-4">
                   <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center">
                      <RefreshCw className="w-8 h-8" />
                   </div>
                   <h3 className="font-bold text-slate-800 text-lg">增量扫描</h3>
                   <p className="text-sm text-slate-500">仅扫描自上次成功扫描后变更或新增的表结构</p>
                   <button className="text-emerald-600 font-semibold hover:underline">查看日志 &rarr;</button>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center space-y-4">
                   <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center">
                      <Search className="w-8 h-8" />
                   </div>
                   <h3 className="font-bold text-slate-800 text-lg">智能发现</h3>
                   <p className="text-sm text-slate-500">利用 Gemini AI 分析潜在的业务敏感元数据</p>
                   <button className="text-amber-600 font-semibold hover:underline">立即体验 &rarr;</button>
                </div>
             </div>
             
             <div className="bg-white p-6 rounded-2xl border border-slate-200">
                <h4 className="font-bold text-slate-800 mb-4">实时任务状态</h4>
                <div className="space-y-4">
                   <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl">
                      <div className="flex items-center space-x-3">
                         <DbIcon className="text-blue-600" />
                         <div>
                            <p className="text-sm font-bold">扫描任务: 核心交易库-01</p>
                            <p className="text-xs text-slate-500">正在扫描表: order_details (12/450)</p>
                         </div>
                      </div>
                      <div className="w-48 bg-slate-200 rounded-full h-2">
                         <div className="bg-blue-600 h-2 rounded-full w-1/4 animate-pulse"></div>
                      </div>
                   </div>
                </div>
             </div>
           </div>
        )}

        {activeTab === 'inspection' && (
           <div className="space-y-6 animate-in zoom-in-95 duration-500">
             <div className="flex justify-between items-end">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">自动巡检报表</h2>
                  <p className="text-slate-500">包含物理空间、备份有效性及增量分析报告</p>
                </div>
                <div className="flex space-x-2">
                  <button className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl text-sm font-semibold flex items-center hover:bg-slate-50">
                     <BarChart3 className="w-4 h-4 mr-2" /> 历史周报
                  </button>
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all">
                     <RefreshCw className="w-4 h-4 mr-2" /> 立即重新巡检
                  </button>
                </div>
             </div>

             {/* 摘要信息 */}
             <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                  { title: '备份检查', status: 'success', icon: <CheckCircle />, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                  { title: '主从同步', status: 'warning', icon: <AlertTriangle />, color: 'text-amber-500', bg: 'bg-amber-50' },
                  { title: '数据增量', status: 'normal', icon: <ArrowUpRight />, color: 'text-blue-500', bg: 'bg-blue-50', extra: '+6.2 GB' },
                  { title: '大表隐患', status: 'danger', icon: <HardDrive />, color: 'text-red-500', bg: 'bg-red-50', extra: '1个高危' },
                ].map((item, i) => (
                   <div key={i} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${item.bg} ${item.color}`}>
                        {item.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-400 font-bold uppercase">{item.title}</p>
                        <p className="text-sm font-bold text-slate-800 truncate">{item.extra || '状态正常'}</p>
                      </div>
                   </div>
                ))}
             </div>

             {/* 增量分析 & 大表详情 */}
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 每日增量图表 */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                   <div className="flex items-center justify-between mb-6">
                      <h3 className="font-bold text-slate-800 flex items-center">
                        <Layers className="w-5 h-5 mr-2 text-blue-500" />
                        全网数据增量分析
                      </h3>
                      <span className="text-xs text-slate-400">最近 7 天</span>
                   </div>
                   <div className="h-48 mb-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={incrementData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} axisLine={false} tickLine={false} />
                          <YAxis stroke="#94a3b8" fontSize={11} axisLine={false} tickLine={false} />
                          <Tooltip 
                            cursor={{ fill: '#f8fafc' }}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                          />
                          <Bar dataKey="inc" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
                        </BarChart>
                      </ResponsiveContainer>
                   </div>
                   <div className="pt-4 border-t border-slate-50 flex justify-between items-center text-sm">
                      <span className="text-slate-500">今日预计增量</span>
                      <span className="font-bold text-blue-600">+6.2 GB</span>
                   </div>
                </div>

                {/* 大表检查报告 */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                   <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
                      <h3 className="font-bold text-slate-800 flex items-center">
                        <HardDrive className="w-5 h-5 mr-2 text-red-500" />
                        Top 大表治理清单
                      </h3>
                      <span className="px-2 py-1 bg-red-100 text-red-600 text-[10px] font-bold rounded uppercase">已检出 42 个风险点</span>
                   </div>
                   <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead className="bg-slate-50 text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                          <tr>
                            <th className="px-6 py-3">物理表名</th>
                            <th className="px-6 py-3">数据记录</th>
                            <th className="px-6 py-3">表尺寸 (Size)</th>
                            <th className="px-6 py-3 text-right">优化建议</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {largeTables.map((table, i) => (
                            <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-6 py-4">
                                <div className="text-sm font-bold text-slate-800">{table.name}</div>
                                <div className="text-xs text-slate-400">库: {table.db} ({table.type})</div>
                              </td>
                              <td className="px-6 py-4 text-sm text-slate-600">{table.rows} 行</td>
                              <td className="px-6 py-4">
                                <div className="flex items-center space-x-2">
                                  <div className="flex-1 h-1.5 w-16 bg-slate-100 rounded-full overflow-hidden">
                                     <div 
                                      className={`h-full ${table.risk === 'high' ? 'bg-red-500' : table.risk === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                                      style={{ width: table.risk === 'high' ? '85%' : table.risk === 'medium' ? '50%' : '30%' }}
                                     ></div>
                                  </div>
                                  <span className="text-sm font-bold text-slate-700">{table.size}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-right">
                                {table.risk === 'high' ? (
                                  <button className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded hover:bg-red-100">建议分区</button>
                                ) : table.risk === 'medium' ? (
                                  <button className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded hover:bg-amber-100">历史归档</button>
                                ) : (
                                  <span className="text-xs text-slate-400">暂无建议</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                   </div>
                   <div className="p-4 bg-slate-50 text-center">
                      <button className="text-xs font-bold text-blue-600 hover:underline">查看所有大表 (共 156 个) &rarr;</button>
                   </div>
                </div>
             </div>
           </div>
        )}

        {activeTab === 'profile' && (
          <div className="max-w-2xl mx-auto space-y-8 animate-in slide-in-from-top-4 duration-500">
             <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center shadow-sm">
                <div className="relative w-24 h-24 mx-auto mb-4">
                  <img src="https://picsum.photos/seed/admin/200" className="rounded-full ring-4 ring-blue-50 shadow-inner" alt="Admin" />
                  <div className="absolute bottom-0 right-0 p-1 bg-white rounded-full shadow-sm">
                    <div className="w-4 h-4 bg-emerald-500 rounded-full border-2 border-white"></div>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-slate-800">系统管理员</h3>
                <p className="text-slate-500">最后登录: 今天 09:42 (10.22.3.15)</p>
             </div>

             <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                   <h4 className="font-bold text-slate-800">个人偏好配置</h4>
                   <button className="text-blue-600 text-sm font-semibold">保存更改</button>
                </div>
                <div className="p-6 space-y-6">
                   <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-500 mb-1">中英文名</label>
                        <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 focus:ring-2 ring-blue-500 outline-none" defaultValue="张三 (Admin)" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-500 mb-1">通知接收邮箱</label>
                        <input type="email" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 focus:ring-2 ring-blue-500 outline-none" defaultValue="admin@tiangong.com" />
                      </div>
                   </div>
                   <div className="flex items-center justify-between py-2">
                      <div>
                        <p className="font-semibold text-slate-700">高危操作验证</p>
                        <p className="text-sm text-slate-500">进行敏感扫描和配置变更时需要二次确认</p>
                      </div>
                      <div className="w-12 h-6 bg-blue-600 rounded-full relative cursor-pointer">
                         <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        )}
      </div>

      {isModalOpen && (
        <DataSourceModal 
          source={editingSource} 
          onClose={() => setIsModalOpen(false)}
          onSave={(data) => {
            if (editingSource) {
              setSources(prev => prev.map(s => s.id === editingSource.id ? { ...s, ...data } : s));
            } else {
              setSources(prev => [...prev, { ...data, id: Date.now().toString(), status: 'online' } as any]);
            }
            setIsModalOpen(false);
          }}
        />
      )}

      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">确认删除数据源？</h3>
            <p className="text-slate-500 mb-6 text-sm">此操作将移除该 JDBC 连接配置且不可恢复。相关的扫描记录将保留但在管理列表中不可见。</p>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => { setIsDeleteModalOpen(false); setSourceToDelete(null); }}
                className="px-4 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors"
              >
                取消
              </button>
              <button 
                onClick={confirmDelete}
                className="px-4 py-3 bg-red-600 text-white rounded-xl font-bold shadow-lg shadow-red-100 hover:bg-red-700 active:scale-95 transition-all"
              >
                确定删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DatabaseManager;
