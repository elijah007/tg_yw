
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Database, Shield, Activity, Settings, 
  Search, Plus, RefreshCw, Trash2, CheckCircle, XCircle, 
  Database as DbIcon, ShieldCheck, AlertTriangle, Play, X,
  ArrowUpRight, BarChart3, HardDrive, Layers, Sparkles, ChevronRight,
  GitBranch, Clock, FileCode, Wifi, Eye, ShieldAlert, FileText, ServerCrash
} from 'lucide-react';
import { DataSource, SensitiveRule, InspectionRecord, DatabaseType, ScanResult } from '../../types';
import DataSourceModal from './DataSourceModal';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { analyzeSensitiveFields, generateHealthReportSummary } from '../../services/geminiService';
import { INITIAL_DATA_SOURCES } from '../../constants';

const DatabaseManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'sources' | 'sensitive' | 'inspection'>('dashboard');
  const [sources, setSources] = useState<DataSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  // 模拟敏感发现数据
  const [scanResults] = useState<ScanResult[]>([
    { id: 'sc_1', instanceId: '1', database: 'order_db', table: 'users', column: 'phone_number', ruleName: '手机号', riskLevel: 'high', timestamp: '2024-05-22 10:00' },
    { id: 'sc_2', instanceId: '1', database: 'order_db', table: 'orders', column: 'credit_card', ruleName: '银行卡', riskLevel: 'high', timestamp: '2024-05-22 10:05' },
    { id: 'sc_3', instanceId: '2', database: 'analytics_db', table: 'clients', column: 'email', ruleName: '邮箱', riskLevel: 'medium', timestamp: '2024-05-21 15:30' },
  ]);

  // 模拟巡检数据
  const [inspections] = useState<InspectionRecord[]>([
    { id: 'ins_1', instanceId: '1', type: 'backup', status: 'success', timestamp: '2024-05-23 02:00', details: '全量备份完成，耗时45分钟' },
    { id: 'ins_2', instanceId: '2', type: 'replication', status: 'success', timestamp: '2024-05-23 04:00', details: '主从延迟 0s' },
    { id: 'ins_3', instanceId: '3', type: 'ha', status: 'error', timestamp: '2024-05-22 23:15', details: 'Keepalived 状态抖动' },
  ]);

  const [aiReport, setAiReport] = useState<string | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingSource, setEditingSource] = useState<DataSource | null>(null);
  const [sourceToDelete, setSourceToDelete] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<Record<string, { status: 'success' | 'error' | 'loading' | null, msg?: string }>>({});

  /**
   * 强健的 JSON 请求工具
   */
  const safeFetchJson = async (url: string, options?: RequestInit) => {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 5000); // 5秒超时

      const res = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(id);

      if (!res.ok) {
        const errorText = await res.text();
        let errorData;
        try { errorData = JSON.parse(errorText); } catch(e) { errorData = { error: `HTTP ${res.status}` }; }
        throw new Error(errorData.error || '服务器响应异常');
      }

      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('服务器未返回 JSON 格式数据');
      }

      return await res.json();
    } catch (e: any) {
      console.warn(`API [${url}] 访问受阻:`, e.message);
      throw e;
    }
  };

  /**
   * 获取数据源，带降级逻辑
   */
  const fetchSources = async () => {
    setLoading(true);
    try {
      const data = await safeFetchJson('/api/sources');
      if (Array.isArray(data)) {
        setSources(data);
        setIsOfflineMode(false);
      }
    } catch (err: any) {
      // 核心修复：如果后端报错，切换到本地 Mock 数据
      console.log('正在激活离线演示模式 (Offline Demo Mode)');
      setSources(INITIAL_DATA_SOURCES);
      setIsOfflineMode(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSources();
  }, []);

  const handleTestConnection = async (source: DataSource) => {
    if (isOfflineMode) {
      const id = source.id;
      setTestResult(prev => ({ ...prev, [id]: { status: 'loading' } }));
      setTimeout(() => {
        setTestResult(prev => ({ ...prev, [id]: { status: 'success' } }));
      }, 1500);
      return;
    }

    const id = source.id;
    setTestResult(prev => ({ ...prev, [id]: { status: 'loading' } }));
    try {
      const data = await safeFetchJson('/api/sources/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(source)
      });
      setTestResult(prev => ({ ...prev, [id]: { status: data.success ? 'success' : 'error', msg: data.error } }));
    } catch (err: any) {
      setTestResult(prev => ({ ...prev, [id]: { status: 'error', msg: err.message } }));
    }
    setTimeout(() => setTestResult(prev => { const n = {...prev}; delete n[id]; return n; }), 4000);
  };

  const handleSaveSource = async (data: Partial<DataSource>) => {
    if (isOfflineMode) {
      const newSource = { ...data, id: `ds_${Date.now()}`, status: 'online' } as DataSource;
      setSources([newSource, ...sources]);
      setIsModalOpen(false);
      return;
    }

    const payload = editingSource ? { ...editingSource, ...data } : { ...data, id: `ds_${Date.now()}`, status: 'online' };
    try {
      await safeFetchJson('/api/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      await fetchSources();
      setIsModalOpen(false);
    } catch (err: any) {
      alert(`保存失败: ${err.message}`);
    }
  };

  const generateReport = async () => {
    setIsGeneratingReport(true);
    const report = await generateHealthReportSummary(inspections);
    setAiReport(report);
    setIsGeneratingReport(false);
  };

  const chartData = [
    { time: '00:00', connections: 45 }, { time: '04:00', connections: 32 },
    { time: '08:00', connections: 120 }, { time: '12:00', connections: 250 },
    { time: '16:00', connections: 210 }, { time: '20:00', connections: 95 },
  ];

  return (
    <div className="flex h-full min-h-[calc(100vh-64px)]">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-white border-r border-slate-200 p-6 flex flex-col">
        <div className="mb-8 px-4">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Database Cloud</p>
          <h2 className="text-xl font-black text-slate-800">DB 管理子系统</h2>
        </div>
        <nav className="space-y-2 flex-1">
          {[
            { id: 'dashboard', icon: <LayoutDashboard />, label: '运行大屏' },
            { id: 'sources', icon: <DbIcon />, label: '数据源管理' },
            { id: 'sensitive', icon: <Shield />, label: '敏感数据发现' },
            { id: 'inspection', icon: <Activity />, label: '自动化巡检' },
          ].map((item) => (
            <button 
              key={item.id}
              onClick={() => setActiveTab(item.id as any)} 
              className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-2xl transition-all duration-200 ${
                activeTab === item.id 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 ring-4 ring-blue-50' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-blue-600'
              }`}
            >
              {/* Fixed: Added <any> to ReactElement cast to avoid "className does not exist" TS error */}
              {React.cloneElement(item.icon as React.ReactElement<any>, { className: 'w-5 h-5' })}
              <span className="font-bold">{item.label}</span>
            </button>
          ))}
        </nav>
        
        {/* API Status Indicator */}
        <div className={`mt-auto p-4 rounded-2xl border ${isOfflineMode ? 'bg-amber-50 border-amber-100' : 'bg-emerald-50 border-emerald-100'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-[10px] font-black uppercase tracking-wider ${isOfflineMode ? 'text-amber-600' : 'text-emerald-600'}`}>
              {isOfflineMode ? '离线演示模式' : '后端服务已连接'}
            </span>
            {isOfflineMode ? <ServerCrash className="w-3 h-3 text-amber-500" /> : <Wifi className="w-3 h-3 text-emerald-500" />}
          </div>
          <p className="text-[10px] text-slate-400 leading-tight">
            {isOfflineMode ? 'API 连接超时，当前加载预设静态数据' : '正在实时同步元数据库数据'}
          </p>
          {isOfflineMode && (
            <button onClick={fetchSources} className="mt-2 w-full py-1.5 bg-white border border-amber-200 text-[10px] font-bold text-amber-600 rounded-lg hover:bg-amber-100 transition-colors">
              重试连接
            </button>
          )}
        </div>
      </aside>

      <div className="flex-1 p-8 bg-slate-50 overflow-y-auto">
        {loading && (
          <div className="flex flex-col items-center justify-center h-full space-y-4">
             <RefreshCw className="animate-spin text-blue-500 w-12 h-12" />
             <p className="text-slate-400 font-bold animate-pulse">正在同步集群元数据...</p>
          </div>
        )}
        
        {!loading && activeTab === 'dashboard' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <header className="flex justify-between items-end">
              <div>
                <h2 className="text-3xl font-black text-slate-800">数据中心概览</h2>
                <p className="text-slate-400 font-medium">当前监控：3个生产集群，24个数据库节点</p>
              </div>
              <div className="flex space-x-3">
                 <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-600">刷新频率: 10s</div>
              </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { label: '纳管实例', val: sources.length, icon: <DbIcon />, color: 'text-blue-600', bg: 'bg-blue-50' },
                { label: '敏感字段数', val: scanResults.length, icon: <ShieldCheck />, color: 'text-amber-600', bg: 'bg-amber-50' },
                { label: '待处理巡检', val: inspections.filter(i => i.status === 'error').length, icon: <AlertTriangle />, color: 'text-red-600', bg: 'bg-red-50' },
                { label: '系统可用率', val: '99.99%', icon: <CheckCircle />, color: 'text-emerald-600', bg: 'bg-emerald-50' },
              ].map((stat, i) => (
                <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
                  <div className={`p-3 w-fit rounded-2xl ${stat.bg} ${stat.color} mb-6 group-hover:scale-110 transition-transform`}>{stat.icon}</div>
                  <p className="text-sm text-slate-400 font-bold uppercase tracking-wider mb-1">{stat.label}</p>
                  <p className={`text-3xl font-black ${stat.color}`}>{stat.val}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm h-96">
                <div className="flex items-center justify-between mb-8">
                   <h3 className="font-bold text-slate-800">连接数实时趋势 (24h)</h3>
                   <div className="flex space-x-2">
                      <span className="flex items-center text-xs text-slate-400"><span className="w-2 h-2 bg-blue-500 rounded-full mr-1"></span> 生产环境</span>
                   </div>
                </div>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorConn" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="time" stroke="#94a3b8" fontSize={12} axisLine={false} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={12} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                    <Area type="monotone" dataKey="connections" stroke="#2563eb" strokeWidth={3} fill="url(#colorConn)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                 <h3 className="font-bold text-slate-800 mb-6">数据库类型分布</h3>
                 <div className="space-y-6">
                    {[
                      { name: 'MySQL', count: 12, percent: 60, color: 'bg-blue-500' },
                      { name: 'PostgreSQL', count: 5, percent: 25, color: 'bg-indigo-500' },
                      { name: 'MongoDB', count: 3, percent: 15, color: 'bg-emerald-500' },
                    ].map((db, i) => (
                      <div key={i}>
                        <div className="flex justify-between text-sm mb-2">
                           <span className="font-bold text-slate-600">{db.name}</span>
                           <span className="text-slate-400">{db.count} 实例</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                           <div className={`${db.color} h-full transition-all duration-1000`} style={{ width: `${db.percent}%` }}></div>
                        </div>
                      </div>
                    ))}
                 </div>
              </div>
            </div>
          </div>
        )}

        {!loading && activeTab === 'sources' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-black text-slate-800">数据源资产</h2>
                <p className="text-slate-400 font-medium">在此配置 JDBC 物理连接，支持一键实时拨测</p>
              </div>
              <button 
                onClick={() => { setEditingSource(null); setIsModalOpen(true); }} 
                className="bg-blue-600 text-white px-6 py-3.5 rounded-2xl flex items-center font-black shadow-xl shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all"
              >
                <Plus className="w-5 h-5 mr-2" /> 新增数据源
              </button>
            </div>

            <div className="bg-white rounded-[32px] border border-slate-100 overflow-hidden shadow-sm">
              <table className="w-full text-left">
                <thead className="bg-slate-50/50 border-b border-slate-100">
                  <tr>
                    <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">实例标识 / 库名</th>
                    <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">类型</th>
                    <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">终端地址</th>
                    <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">连接状态</th>
                    <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {sources.map((source) => (
                    <tr key={source.id} className="hover:bg-slate-50/50 group transition-colors">
                      <td className="px-8 py-6">
                        <div className="font-black text-slate-800 group-hover:text-blue-600 transition-colors">{source.name}</div>
                        <div className="text-xs text-slate-400 font-bold">{source.database}</div>
                      </td>
                      <td className="px-8 py-6">
                        <span className="px-3 py-1 bg-slate-100 rounded-lg text-[10px] font-black text-slate-500 uppercase tracking-wider">{source.type}</span>
                      </td>
                      <td className="px-8 py-6">
                        <code className="text-xs font-mono text-slate-500 bg-slate-50 px-2 py-1 rounded">{source.host}:{source.port}</code>
                      </td>
                      <td className="px-8 py-6">
                         <div className="flex items-center space-x-2">
                            <span className={`w-2 h-2 rounded-full ${source.status === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></span>
                            <span className="text-xs font-bold text-slate-600 uppercase">{source.status === 'online' ? '就绪' : '离线'}</span>
                         </div>
                      </td>
                      <td className="px-8 py-6 text-right space-x-2">
                        <button 
                          onClick={() => handleTestConnection(source)}
                          title="实时物理拨测"
                          className={`p-3 rounded-xl transition-all ${
                            testResult[source.id]?.status === 'success' ? 'text-emerald-600 bg-emerald-50 ring-2 ring-emerald-100' : 
                            testResult[source.id]?.status === 'error' ? 'text-red-600 bg-red-50 ring-2 ring-red-100' : 
                            testResult[source.id]?.status === 'loading' ? 'text-blue-600 bg-blue-50 animate-pulse' : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50'
                          }`}
                        >
                          <Wifi className="w-5 h-5" />
                        </button>
                        <button onClick={() => { setEditingSource(source); setIsModalOpen(true); }} className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"><Settings className="w-5 h-5" /></button>
                        <button onClick={() => { setSourceToDelete(source.id); setIsDeleteModalOpen(true); }} className="p-3 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"><Trash2 className="w-5 h-5" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!loading && activeTab === 'sensitive' && (
          <div className="space-y-8 animate-in slide-in-from-right-4">
             {/* ... Sensitive View Content ... */}
             <div className="flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-black text-slate-800">敏感发现与扫描</h2>
                <p className="text-slate-400 font-medium">利用 Gemini AI 自动识别 Schema 中的高风险字段</p>
              </div>
              <button className="bg-slate-900 text-white px-6 py-3.5 rounded-2xl flex items-center font-black shadow-xl hover:bg-slate-800 transition-all">
                <Play className="w-5 h-5 mr-2" /> 全量重新扫描
              </button>
            </div>
            {/* Table and stats for sensitive scan */}
            <div className="bg-white rounded-[32px] border border-slate-100 overflow-hidden shadow-sm">
               <table className="w-full text-left">
                  <thead className="bg-slate-50/50 border-b border-slate-100">
                    <tr>
                      <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">位置 (库.表.列)</th>
                      <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">规则名称</th>
                      <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">风险等级</th>
                      <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-right">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {scanResults.map((scan) => (
                      <tr key={scan.id} className="hover:bg-slate-50/50 group transition-colors">
                        <td className="px-8 py-6 flex items-center space-x-2">
                           <FileCode className="w-4 h-4 text-slate-300" />
                           <span className="font-bold text-slate-700">{scan.database}.{scan.table}.<span className="text-blue-600">{scan.column}</span></span>
                        </td>
                        <td className="px-8 py-6"><span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold">{scan.ruleName}</span></td>
                        <td className="px-8 py-6"><span className={`px-3 py-1 rounded-lg text-xs font-bold ${scan.riskLevel === 'high' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>{scan.riskLevel.toUpperCase()}</span></td>
                        <td className="px-8 py-6 text-right"><button className="text-sm font-bold text-blue-600 hover:underline">处理掩码</button></td>
                      </tr>
                    ))}
                  </tbody>
               </table>
            </div>
          </div>
        )}

        {!loading && activeTab === 'inspection' && (
          <div className="space-y-8 animate-in slide-in-from-top-4">
             <div className="flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-black text-slate-800">自动化巡检</h2>
                <p className="text-slate-400 font-medium">每日凌晨自动对主从、备份、负载均衡进行状态拨测</p>
              </div>
              <button 
                onClick={generateReport}
                disabled={isGeneratingReport}
                className="bg-emerald-600 text-white px-6 py-3.5 rounded-2xl flex items-center font-black shadow-xl shadow-emerald-200 hover:bg-emerald-700 transition-all disabled:opacity-50"
              >
                {isGeneratingReport ? <RefreshCw className="w-5 h-5 mr-2 animate-spin" /> : <Sparkles className="w-5 h-5 mr-2" />}
                生成 AI 巡检日报
              </button>
            </div>
            
            {aiReport && (
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-[32px] text-white shadow-2xl relative overflow-hidden group">
                 <div className="relative z-10">
                    <div className="flex items-center space-x-2 mb-4">
                       <span className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest">Gemini AI Analysis</span>
                    </div>
                    <p className="text-xl leading-relaxed font-medium italic text-slate-100 mb-4">{aiReport}</p>
                    <button onClick={() => setAiReport(null)} className="text-sm font-bold text-slate-500 hover:text-slate-300">隐藏报告</button>
                 </div>
              </div>
            )}

            <div className="space-y-4">
               {inspections.map((ins) => (
                 <div key={ins.id} className="bg-white p-6 rounded-3xl border border-slate-100 flex items-center justify-between hover:border-blue-200 transition-all">
                    <div className="flex items-center space-x-6">
                       <div className={`p-4 rounded-2xl ${ins.status === 'success' ? 'bg-emerald-50 text-emerald-500' : 'bg-red-50 text-red-500'}`}>
                          {ins.type === 'backup' ? <HardDrive /> : ins.type === 'replication' ? <GitBranch /> : <Layers />}
                       </div>
                       <div>
                          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{ins.type}</p>
                          <h4 className="font-black text-slate-800">任务 #{ins.id.split('_')[1]}</h4>
                          <p className="text-sm text-slate-500 mt-1">{ins.details}</p>
                       </div>
                    </div>
                    <div className="text-right">
                       <div className="text-xs font-bold text-slate-400 mb-2">{ins.timestamp}</div>
                       <span className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest ${ins.status === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                         {ins.status.toUpperCase()}
                       </span>
                    </div>
                 </div>
               ))}
            </div>
          </div>
        )}
      </div>

      {isModalOpen && <DataSourceModal source={editingSource} onClose={() => setIsModalOpen(false)} onSave={handleSaveSource} />}
      
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4">
          <div className="bg-white w-full max-w-sm rounded-[40px] p-10 text-center shadow-2xl">
            <h3 className="text-2xl font-black text-slate-800 mb-2">确认删除？</h3>
            <p className="text-slate-500 mb-8">此操作将永久注销该资产。当前处于{isOfflineMode ? '本地模式' : '同步模式'}。</p>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => setIsDeleteModalOpen(false)} className="px-4 py-4 bg-slate-100 rounded-2xl font-black">取消</button>
              <button onClick={() => { /* Delete logic */ setIsDeleteModalOpen(false); }} className="px-4 py-4 bg-red-600 text-white rounded-2xl font-black">确认执行</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DatabaseManager;
