
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Database, Shield, Activity, Settings, 
  Search, Plus, RefreshCw, Trash2, CheckCircle, XCircle, 
  Database as DbIcon, ShieldCheck, AlertTriangle, Play, X,
  ArrowUpRight, BarChart3, HardDrive, Layers, Sparkles, ChevronRight,
  GitBranch, Clock, FileCode, Wifi
} from 'lucide-react';
import { DataSource, SensitiveRule, InspectionRecord, DatabaseType } from '../../types';
import DataSourceModal from './DataSourceModal';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const DatabaseManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'sources' | 'sensitive' | 'inspection' | 'profile'>('dashboard');
  const [sources, setSources] = useState<DataSource[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingSource, setEditingSource] = useState<DataSource | null>(null);
  const [sourceToDelete, setSourceToDelete] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<Record<string, { status: 'success' | 'error' | 'loading' | null, msg?: string }>>({});

  // 稳健的 JSON 获取工具
  const safeFetchJson = async (url: string, options?: RequestInit) => {
    try {
      const res = await fetch(url, options);
      const text = await res.text();
      return JSON.parse(text);
    } catch (e) {
      throw new Error("接口响应解析失败，请检查后端运行状态。");
    }
  };

  const fetchSources = async () => {
    try {
      setLoading(true);
      const data = await safeFetchJson('/api/sources');
      if (Array.isArray(data)) {
        setSources(data);
      }
    } catch (err: any) {
      console.error('Fetch error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSources();
  }, []);

  const handleTestConnection = async (source: DataSource) => {
    const id = source.id;
    setTestResult(prev => ({ ...prev, [id]: { status: 'loading' } }));
    try {
      const data = await safeFetchJson('/api/sources/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(source)
      });
      if (data.success) {
        setTestResult(prev => ({ ...prev, [id]: { status: 'success' } }));
      } else {
        setTestResult(prev => ({ ...prev, [id]: { status: 'error', msg: data.error } }));
      }
    } catch (err: any) {
      setTestResult(prev => ({ ...prev, [id]: { status: 'error', msg: '请求超时' } }));
    }
    setTimeout(() => {
      setTestResult(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }, 4000);
  };

  const handleSaveSource = async (data: Partial<DataSource>) => {
    // 如果 editingSource 存在，说明是修改，沿用原 ID；否则生成新 ID
    const payload = editingSource 
      ? { ...editingSource, ...data } 
      : { ...data, id: `ds_${Date.now()}`, status: 'online' };

    try {
      const resData = await safeFetchJson('/api/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (resData.success) {
        await fetchSources(); // 重新拉取数据库最新真实列表
        setIsModalOpen(false);
      } else {
        alert('保存失败: ' + resData.error);
      }
    } catch (err: any) {
      alert('网络异常: ' + err.message);
    }
  };

  const confirmDelete = async () => {
    if (sourceToDelete) {
      try {
        const resData = await safeFetchJson(`/api/sources/${sourceToDelete}`, { method: 'DELETE' });
        if (resData.success) {
          // 真正的数据库删除成功后，再更新 UI
          setSources(prev => prev.filter(s => s.id !== sourceToDelete));
          setSourceToDelete(null);
          setIsDeleteModalOpen(false);
        } else {
          alert('删除失败: ' + resData.error);
        }
      } catch (err: any) {
        alert('删除操作异常');
      }
    }
  };

  const chartData = [
    { time: '00:00', connections: 45 }, { time: '04:00', connections: 32 },
    { time: '08:00', connections: 120 }, { time: '12:00', connections: 250 },
    { time: '16:00', connections: 210 }, { time: '20:00', connections: 95 },
  ];

  return (
    <div className="flex h-full min-h-[calc(100vh-64px)]">
      <aside className="w-64 bg-white border-r border-slate-200 p-6 flex flex-col">
        <nav className="space-y-2 flex-1">
          <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'dashboard' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>
            <LayoutDashboard className="w-5 h-5" />
            <span className="font-medium">概览大屏</span>
          </button>
          <button onClick={() => setActiveTab('sources')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'sources' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>
            <DbIcon className="w-5 h-5" />
            <span className="font-medium">数据源管理</span>
          </button>
          <button onClick={() => setActiveTab('sensitive')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'sensitive' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>
            <Shield className="w-5 h-5" />
            <span className="font-medium">敏感发现</span>
          </button>
          <button onClick={() => setActiveTab('inspection')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'inspection' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>
            <Activity className="w-5 h-5" />
            <span className="font-medium">日常巡检</span>
          </button>
        </nav>
      </aside>

      <div className="flex-1 p-8 bg-slate-50 overflow-y-auto">
        {loading && <div className="flex items-center justify-center h-full"><RefreshCw className="animate-spin text-blue-500 w-10 h-10" /></div>}
        
        {!loading && activeTab === 'dashboard' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <h2 className="text-2xl font-bold text-slate-800">数据库运行概览</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { label: '连接实例', val: sources.length, icon: <DbIcon />, color: 'text-blue-600', bg: 'bg-blue-50', link: 'sources' },
                { label: '敏感字段', val: '128', icon: <ShieldCheck />, color: 'text-amber-600', bg: 'bg-amber-50', link: 'sensitive' },
                { label: '昨日巡检', val: '通过', icon: <CheckCircle />, color: 'text-emerald-600', bg: 'bg-emerald-50', link: 'inspection' },
                { label: '预警事件', val: '0', icon: <AlertTriangle />, color: 'text-slate-400', bg: 'bg-slate-50', link: 'inspection' },
              ].map((stat, i) => (
                <div key={i} onClick={() => setActiveTab(stat.link as any)} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm cursor-pointer hover:shadow-md transition-all group">
                  <div className={`p-2 w-fit rounded-lg ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform mb-4`}>{stat.icon}</div>
                  <p className="text-sm text-slate-500 font-medium">{stat.label}</p>
                  <p className={`text-2xl font-bold ${stat.color}`}>{stat.val}</p>
                </div>
              ))}
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="time" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip />
                  <Area type="monotone" dataKey="connections" stroke="#2563eb" fill="#2563eb" fillOpacity={0.1} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {!loading && activeTab === 'sources' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">数据源管理</h2>
                <p className="text-slate-500">点击侧边按钮修改或测试物理连接</p>
              </div>
              <button onClick={() => { setEditingSource(null); setIsModalOpen(true); }} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl flex items-center font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 active:scale-95 transition-all">
                <Plus className="w-5 h-5 mr-2" /> 新增 JDBC 数据源
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-sm font-bold text-slate-600">实例名称 / 库名</th>
                    <th className="px-6 py-4 text-sm font-bold text-slate-600">类型</th>
                    <th className="px-6 py-4 text-sm font-bold text-slate-600">地址端口</th>
                    <th className="px-6 py-4 text-sm font-bold text-slate-600 text-right">管理操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sources.length === 0 ? (
                    <tr><td colSpan={4} className="px-6 py-20 text-center text-slate-400">暂无真实数据，请添加您的第一个数据源</td></tr>
                  ) : (
                    sources.map((source) => (
                      <tr key={source.id} className="hover:bg-slate-50/50 group transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{source.name}</div>
                          <div className="text-xs text-slate-400 font-medium">{source.database}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 bg-slate-100 rounded text-xs font-bold text-slate-500 uppercase">{source.type}</span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 font-mono">{source.host}:{source.port}</td>
                        <td className="px-6 py-4 text-right space-x-1">
                          <button 
                            onClick={() => handleTestConnection(source)}
                            title="物理拨测"
                            className={`p-2.5 rounded-lg transition-all ${
                              testResult[source.id]?.status === 'success' ? 'text-emerald-600 bg-emerald-50' : 
                              testResult[source.id]?.status === 'error' ? 'text-red-600 bg-red-50' : 
                              testResult[source.id]?.status === 'loading' ? 'text-blue-600 bg-blue-50' : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50'
                            }`}
                          >
                            <Wifi className={`w-4 h-4 ${testResult[source.id]?.status === 'loading' ? 'animate-pulse' : ''}`} />
                          </button>
                          <button onClick={() => { setEditingSource(source); setIsModalOpen(true); }} className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"><Settings className="w-4 h-4" /></button>
                          <button onClick={() => { setSourceToDelete(source.id); setIsDeleteModalOpen(true); }} className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"><Trash2 className="w-4 h-4" /></button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            {Object.entries(testResult).filter(([_, v]: [string, any]) => v.status === 'error').map(([id, v]: [string, any]) => (
              <div key={id} className="fixed bottom-10 right-10 bg-red-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center space-x-3 animate-in slide-in-from-right duration-300">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <div className="text-sm">
                   <p className="font-bold">[{sources.find(s => s.id === id)?.name}] 连接失败</p>
                   <p className="opacity-90">{v.msg}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <DataSourceModal 
          source={editingSource} 
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveSource}
        />
      )}

      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-8 text-center shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
               <Trash2 className="w-10 h-10 text-red-500" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-2">确认永久删除？</h3>
            <p className="text-slate-500 text-sm mb-8 leading-relaxed">此操作将从数据库中彻底抹除该配置，<br/>所有关联的自动巡检计划将失效。</p>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setIsDeleteModalOpen(false)} 
                className="px-4 py-3 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-colors"
              >
                取消
              </button>
              <button 
                onClick={confirmDelete} 
                className="px-4 py-3 bg-red-600 text-white rounded-2xl font-bold hover:bg-red-700 shadow-xl shadow-red-100 transition-all active:scale-95"
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DatabaseManager;
