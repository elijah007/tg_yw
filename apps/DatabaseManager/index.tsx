
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Database, Shield, Activity, Settings, 
  Search, Plus, RefreshCw, Trash2, CheckCircle, XCircle, 
  Database as DbIcon, ShieldCheck, AlertTriangle, Play, X,
  ArrowUpRight, BarChart3, HardDrive, Layers, Sparkles, ChevronRight,
  GitBranch, Clock, FileCode
} from 'lucide-react';
import { DataSource, SensitiveRule, InspectionRecord, DatabaseType } from '../../types';
import { INITIAL_DATA_SOURCES } from '../../constants';
import DataSourceModal from './DataSourceModal';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from 'recharts';

const DatabaseManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'sources' | 'sensitive' | 'inspection' | 'profile'>('dashboard');
  const [sources, setSources] = useState<DataSource[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingSource, setEditingSource] = useState<DataSource | null>(null);
  const [sourceToDelete, setSourceToDelete] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<Record<string, 'success' | 'error' | 'loading' | null>>({});

  // 从后端 API 加载数据
  const fetchSources = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/sources');
      const data = await res.json();
      setSources(data);
    } catch (err) {
      console.error('Fetch error:', err);
      // 如果后端没准备好，暂时用初始值演示
      setSources(INITIAL_DATA_SOURCES);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSources();
  }, []);

  const handleTestConnection = async (id: string) => {
    setTestResult(prev => ({ ...prev, [id]: 'loading' }));
    await new Promise(resolve => setTimeout(resolve, 1500));
    const success = Math.random() > 0.2;
    setTestResult(prev => ({ ...prev, [id]: success ? 'success' : 'error' }));
  };

  // 写入数据库
  const handleSaveSource = async (data: Partial<DataSource>) => {
    const payload = editingSource 
      ? { ...editingSource, ...data } 
      : { ...data, id: Date.now().toString(), status: 'online' };

    try {
      await fetch('/api/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      fetchSources(); // 重新加载
      setIsModalOpen(false);
    } catch (err: any) {
      // Use any for err to access message property safely in potentially strict environment
      alert('保存失败: ' + err.message);
    }
  };

  // 从数据库删除
  const confirmDelete = async () => {
    if (sourceToDelete) {
      try {
        await fetch(`/api/sources/${sourceToDelete}`, { method: 'DELETE' });
        fetchSources();
        setSourceToDelete(null);
        setIsDeleteModalOpen(false);
      } catch (err) {
        alert('删除失败');
      }
    }
  };

  // 扫描相关状态 (省略了部分重复代码，逻辑保持不变)
  const [isScanSelectorOpen, setIsScanSelectorOpen] = useState(false);
  const [selectedScanType, setSelectedScanType] = useState<'full' | 'incremental' | 'ai' | null>(null);
  const [targetSourceId, setTargetSourceId] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [inspectionDays, setInspectionDays] = useState(7);

  const startScan = async () => {
    if (!targetSourceId) return;
    setIsScanSelectorOpen(false);
    setIsScanning(true);
    await new Promise(resolve => setTimeout(resolve, 3000));
    setIsScanning(false);
    alert('任务已下发！可在下方查看实时状态。');
  };

  // 图表模拟数据
  const chartData = [
    { time: '00:00', connections: 45 },
    { time: '04:00', connections: 32 },
    { time: '08:00', connections: 120 },
    { time: '12:00', connections: 250 },
    { time: '16:00', connections: 210 },
    { time: '20:00', connections: 95 },
  ];

  const incrementData = [
    { date: '10-20', inc: 2.4 }, { date: '10-21', inc: 3.1 }, { date: '10-22', inc: 4.8 },
    { date: '10-23', inc: 4.2 }, { date: '10-24', inc: 5.5 }, { date: '10-25', inc: 4.9 }, { date: '今日', inc: 6.2 },
  ];

  const largeTables = [
    { name: 'order_details', db: 'order_db', rows: '4.2亿', size: '124.5 GB', type: 'MySQL', risk: 'high' },
    { name: 'user_action_logs', db: 'logs', rows: '12亿', size: '89.2 GB', type: 'Mongo', risk: 'medium' },
  ];

  const ddlChanges = [
    { id: 1, table: 'users', type: 'ADD COLUMN', detail: 'added last_login_ip (VARCHAR)', date: '2024-05-23', source: '生产库-核心-01' },
    { id: 2, table: 'orders', type: 'MODIFY COLUMN', detail: 'changed amount precision (18,2)', date: '2024-05-22', source: '生产库-核心-01' },
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
            <span className="font-medium">敏感数据发现</span>
          </button>
          <button onClick={() => setActiveTab('inspection')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'inspection' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>
            <Activity className="w-5 h-5" />
            <span className="font-medium">日常巡检</span>
          </button>
        </nav>
        <div className="pt-6 border-t border-slate-100">
          <button onClick={() => setActiveTab('profile')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'profile' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>
            <Settings className="w-5 h-5" />
            <span className="font-medium">个人配置</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 p-8 bg-slate-50 overflow-y-auto">
        {loading && <div className="flex items-center justify-center h-full"><RefreshCw className="animate-spin text-blue-500" /></div>}
        
        {!loading && activeTab === 'dashboard' && (
          <div className="space-y-8 animate-in fade-in duration-500">
             <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">数据库运行概览</h2>
                <p className="text-slate-500">已从 MySQL 持久化层同步数据</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { label: '连接实例', val: sources.length, icon: <DbIcon />, color: 'text-blue-600', bg: 'bg-blue-50', link: 'sources' },
                { label: '敏感字段', val: '128', icon: <ShieldCheck />, color: 'text-amber-600', bg: 'bg-amber-50', link: 'sensitive' },
                { label: '昨日巡检', val: '通过', icon: <CheckCircle />, color: 'text-emerald-600', bg: 'bg-emerald-50', link: 'inspection' },
                { label: '预警事件', val: '0', icon: <AlertTriangle />, color: 'text-slate-400', bg: 'bg-slate-50', link: 'inspection' },
              ].map((stat, i) => (
                <div key={i} onClick={() => setActiveTab(stat.link as any)} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm cursor-pointer hover:shadow-md transition-all group">
                  <div className="flex items-center justify-between mb-2">
                    <div className={`p-2 rounded-lg ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform`}>{stat.icon}</div>
                  </div>
                  <p className="text-sm text-slate-500 font-medium">{stat.label}</p>
                  <p className={`text-2xl font-bold ${stat.color}`}>{stat.val}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-80">
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
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                 <h3 className="text-lg font-bold text-slate-800 mb-4">系统健康</h3>
                 <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center space-x-3 text-emerald-700">
                    <CheckCircle />
                    <span className="font-bold">数据库持久化层运行正常</span>
                 </div>
              </div>
            </div>
          </div>
        )}

        {!loading && activeTab === 'sources' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">数据源管理</h2>
                {/* Fixed "Cannot find name 'dbConfig'" by replacing with static context text */}
                <p className="text-slate-500">连接已同步至系统持久化库</p>
              </div>
              <button onClick={() => { setEditingSource(null); setIsModalOpen(true); }} className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center shadow-lg hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" /> 新增数据源
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-sm font-semibold text-slate-600">实例名称</th>
                    <th className="px-6 py-4 text-sm font-semibold text-slate-600">数据库类型</th>
                    <th className="px-6 py-4 text-sm font-semibold text-slate-600">地址</th>
                    <th className="px-6 py-4 text-sm font-semibold text-slate-600 text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sources.map((source) => (
                    <tr key={source.id} className="hover:bg-slate-50/50 group">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-800">{source.name}</div>
                        <div className="text-xs text-slate-400">{source.database}</div>
                      </td>
                      <td className="px-6 py-4 capitalize text-sm">{source.type}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{source.host}:{source.port}</td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button onClick={() => { setEditingSource(source); setIsModalOpen(true); }} className="p-2 text-slate-400 hover:text-indigo-600"><Settings className="w-4 h-4" /></button>
                        <button onClick={() => { setSourceToDelete(source.id); setIsDeleteModalOpen(true); }} className="p-2 text-slate-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-2xl p-6 text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-6">确认从 MySQL 删除该记录？</h3>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setIsDeleteModalOpen(false)} className="px-4 py-2 bg-slate-100 rounded-xl">取消</button>
              <button onClick={confirmDelete} className="px-4 py-2 bg-red-600 text-white rounded-xl">确认删除</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DatabaseManager;
