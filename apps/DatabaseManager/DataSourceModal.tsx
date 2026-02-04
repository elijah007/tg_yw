
import React, { useState, useEffect } from 'react';
// Add missing CheckCircle icon import
import { X, Database, Globe, Lock, User, Hash, AlertCircle, Wifi, ShieldCheck, Sparkles, CheckCircle } from 'lucide-react';
import { DataSource, DatabaseType } from '../../types';

interface Props {
  source?: DataSource | null;
  onClose: () => void;
  onSave: (data: Partial<DataSource>) => void;
}

const DataSourceModal: React.FC<Props> = ({ source, onClose, onSave }) => {
  const [formData, setFormData] = useState<Partial<DataSource>>({
    name: '',
    type: 'mysql',
    host: '127.0.0.1',
    port: 3306,
    database: '',
    username: '',
    password: ''
  });

  const [testState, setTestState] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (source) {
      setFormData({
        name: source.name,
        type: source.type,
        host: source.host,
        port: source.port,
        database: source.database,
        username: source.username,
        password: '' 
      });
    }
  }, [source]);

  const handleTest = async () => {
    setTestState('testing');
    setErrorMsg(null);
    try {
      // 关键：此接口仅接收内存参数进行临时物理连接，不涉及数据库写入
      const res = await fetch('/api/sources/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        setTestState('success');
      } else {
        setTestState('error');
        setErrorMsg(data.error || '连接认证失败');
      }
    } catch (err: any) {
      setTestState('error');
      setErrorMsg('网络路由不可达或超时');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-white/20">
        <div className="px-10 py-8 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2 mb-1">
               <ShieldCheck className="w-5 h-5 text-blue-600" />
               <h3 className="text-2xl font-black text-slate-800">{source ? '修正资产配置' : '注册新数据源'}</h3>
            </div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">请验证 JDBC 终端的连通性后再执行保存</p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-slate-200 rounded-full transition-colors">
            <X className="w-6 h-6 text-slate-400" />
          </button>
        </div>

        <div className="p-10 space-y-6">
          {errorMsg && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start space-x-3 text-red-600 text-sm animate-in slide-in-from-top-2">
              <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
              <div className="font-bold">{errorMsg}</div>
            </div>
          )}

          {testState === 'success' && (
            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center space-x-3 text-emerald-600 text-sm animate-in slide-in-from-top-2">
              <CheckCircle className="w-5 h-5 shrink-0" />
              <div className="font-bold italic text-emerald-700">物理连接验证通过！配置环境已就绪。</div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">资产名称 (Alias)</label>
              <div className="relative">
                <Database className="absolute left-5 top-4 w-5 h-5 text-slate-300" />
                <input 
                  type="text" 
                  className="w-full pl-14 pr-5 py-4 border border-slate-200 rounded-2xl bg-slate-50 focus:ring-4 ring-blue-500/10 focus:border-blue-500 outline-none font-bold transition-all"
                  placeholder="例如：核心交易库-Slave01"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">引擎类型</label>
                <select 
                  className="w-full px-5 py-4 border border-slate-200 rounded-2xl bg-slate-50 focus:ring-4 ring-blue-500/10 outline-none font-black text-slate-700 appearance-none"
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value as DatabaseType})}
                >
                  <option value="mysql">MySQL</option>
                  <option value="postgresql">PostgreSQL</option>
                  <option value="mongodb">MongoDB</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Host & Port</label>
                <div className="flex space-x-2">
                  <input 
                    type="text" 
                    className="flex-1 px-5 py-4 border border-slate-200 rounded-2xl bg-slate-50 focus:ring-4 ring-blue-500/10 outline-none font-mono font-bold"
                    placeholder="10.25.0.12"
                    value={formData.host}
                    onChange={(e) => setFormData({...formData, host: e.target.value})}
                  />
                  <input 
                    type="number" 
                    className="w-28 px-5 py-4 border border-slate-200 rounded-2xl bg-slate-50 focus:ring-4 ring-blue-500/10 outline-none font-mono font-bold"
                    placeholder="3306"
                    value={formData.port}
                    onChange={(e) => setFormData({...formData, port: parseInt(e.target.value) || 0})}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Schema 数据库名</label>
                  <input 
                    type="text" 
                    className="w-full px-5 py-4 border border-slate-200 rounded-2xl bg-slate-50 focus:ring-4 ring-blue-500/10 outline-none font-bold"
                    placeholder="production_db"
                    value={formData.database}
                    onChange={(e) => setFormData({...formData, database: e.target.value})}
                  />
               </div>
               <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">访问账号</label>
                  <div className="relative">
                    <User className="absolute left-5 top-4 w-5 h-5 text-slate-300" />
                    <input 
                      type="text" 
                      className="w-full pl-14 pr-5 py-4 border border-slate-200 rounded-2xl bg-slate-50 focus:ring-4 ring-blue-500/10 outline-none font-bold"
                      placeholder="root"
                      value={formData.username}
                      onChange={(e) => setFormData({...formData, username: e.target.value})}
                    />
                  </div>
               </div>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">安全密钥 (Password)</label>
              <div className="relative">
                <Lock className="absolute left-5 top-4 w-5 h-5 text-slate-300" />
                <input 
                  type="password" 
                  className="w-full pl-14 pr-5 py-4 border border-slate-200 rounded-2xl bg-slate-50 focus:ring-4 ring-blue-500/10 outline-none font-bold"
                  placeholder={source ? "•••••••• (留空则不修改)" : "请输入明文密码"}
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="px-10 py-8 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button 
            onClick={handleTest}
            disabled={testState === 'testing'}
            className={`px-8 py-4 rounded-2xl text-sm font-black transition-all flex items-center shadow-lg ${
              testState === 'testing' ? 'bg-slate-200 text-slate-500' : 
              testState === 'success' ? 'bg-emerald-600 text-white shadow-emerald-100' :
              testState === 'error' ? 'bg-red-600 text-white shadow-red-100' :
              'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            {testState === 'testing' ? '正在链路拨测...' : 
             testState === 'success' ? '重新拨测' : 
             testState === 'error' ? '测试失败，请重试' : '测试连接 (In-Memory)'}
            {testState === 'testing' && <Wifi className="w-4 h-4 ml-2 animate-ping" />}
          </button>
          <div className="flex space-x-4">
            <button onClick={onClose} className="px-6 py-4 text-slate-500 hover:text-slate-800 font-black transition-colors">取消</button>
            <button 
              onClick={() => onSave(formData)}
              className="px-10 py-4 bg-blue-600 text-white rounded-2xl font-black shadow-2xl shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all"
            >
              提交保存
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataSourceModal;
