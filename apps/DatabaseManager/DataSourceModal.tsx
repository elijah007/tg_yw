
import React, { useState, useEffect } from 'react';
import { X, Database, Globe, Lock, User, Hash, AlertCircle, Wifi } from 'lucide-react';
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

  // 当传入 source (编辑模式) 时，同步到表单
  useEffect(() => {
    if (source) {
      setFormData({
        name: source.name,
        type: source.type,
        host: source.host,
        port: source.port,
        database: source.database,
        username: source.username,
        password: '' // 密码安全起见编辑时不回传，除非重新输入
      });
    }
  }, [source]);

  const [testState, setTestState] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleTest = async () => {
    setTestState('testing');
    setErrorMsg(null);
    try {
      const res = await fetch('/api/sources/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const text = await res.text();
      let data;
      try { data = JSON.parse(text); } catch(e) { throw new Error("服务器响应无效"); }
      
      if (res.ok && data.success) {
        setTestState('success');
      } else {
        setTestState('error');
        setErrorMsg(data.error || '测试失败');
      }
    } catch (err: any) {
      setTestState('error');
      setErrorMsg(err.message || '网络请求异常');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-white/20">
        <div className="px-8 py-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-slate-800">{source ? '编辑数据源配置' : '新增数据源'}</h3>
            <p className="text-xs text-slate-400 mt-0.5">请确保后端防火墙已放行天工平台 IP</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="p-8 space-y-5">
          {errorMsg && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start space-x-3 text-red-600 text-sm animate-in slide-in-from-top-2">
              <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
              <div className="font-medium">{errorMsg}</div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">实例友好名称</label>
              <div className="relative">
                <Database className="absolute left-4 top-3.5 w-5 h-5 text-slate-300" />
                <input 
                  type="text" 
                  className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-2xl bg-slate-50 focus:ring-2 ring-blue-500 outline-none font-medium transition-all"
                  placeholder="例如：订单库-主实例"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
            </div>
            
            <div className="flex space-x-4">
              <div className="flex-1">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">库类型</label>
                <select 
                  className="w-full px-4 py-3 border border-slate-200 rounded-2xl bg-slate-50 focus:ring-2 ring-blue-500 outline-none capitalize font-bold text-slate-700"
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value as DatabaseType})}
                >
                  <option value="mysql">MySQL</option>
                  <option value="postgresql">PostgreSQL</option>
                  <option value="mongodb">MongoDB</option>
                </select>
              </div>
              <div className="flex-2">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">主机 & 端口</label>
                <div className="flex space-x-2">
                  <input 
                    type="text" 
                    className="flex-1 px-4 py-3 border border-slate-200 rounded-2xl bg-slate-50 focus:ring-2 ring-blue-500 outline-none font-mono"
                    placeholder="127.0.0.1"
                    value={formData.host}
                    onChange={(e) => setFormData({...formData, host: e.target.value})}
                  />
                  <input 
                    type="number" 
                    className="w-24 px-4 py-3 border border-slate-200 rounded-2xl bg-slate-50 focus:ring-2 ring-blue-500 outline-none font-mono"
                    placeholder="3306"
                    value={formData.port}
                    onChange={(e) => setFormData({...formData, port: parseInt(e.target.value) || 0})}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">数据库名</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-3 border border-slate-200 rounded-2xl bg-slate-50 focus:ring-2 ring-blue-500 outline-none font-medium"
                    placeholder="orders_prod"
                    value={formData.database}
                    onChange={(e) => setFormData({...formData, database: e.target.value})}
                  />
               </div>
               <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">访问账号</label>
                  <div className="relative">
                    <User className="absolute left-4 top-3.5 w-5 h-5 text-slate-300" />
                    <input 
                      type="text" 
                      className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-2xl bg-slate-50 focus:ring-2 ring-blue-500 outline-none"
                      placeholder="readonly_user"
                      value={formData.username}
                      onChange={(e) => setFormData({...formData, username: e.target.value})}
                    />
                  </div>
               </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">安全密码</label>
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 w-5 h-5 text-slate-300" />
                <input 
                  type="password" 
                  className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-2xl bg-slate-50 focus:ring-2 ring-blue-500 outline-none"
                  placeholder={source ? "•••••••• (留空保持原密码)" : "连接密码"}
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button 
            onClick={handleTest}
            disabled={testState === 'testing'}
            className={`px-5 py-3 rounded-2xl text-sm font-bold transition-all flex items-center ${
              testState === 'testing' ? 'bg-slate-200 text-slate-500' : 
              testState === 'success' ? 'bg-emerald-600 text-white' :
              testState === 'error' ? 'bg-red-600 text-white' :
              'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            {testState === 'testing' ? '正在拨测...' : 
             testState === 'success' ? '连接成功 ✓' : 
             testState === 'error' ? '重试连接' : '测试连接'}
            {testState === 'testing' && <Wifi className="w-4 h-4 ml-2 animate-pulse" />}
          </button>
          <div className="flex space-x-3">
            <button onClick={onClose} className="px-5 py-3 text-slate-500 hover:text-slate-800 font-bold transition-colors">取消</button>
            <button 
              onClick={() => onSave(formData)}
              className="px-8 py-3 bg-blue-600 text-white rounded-2xl font-bold shadow-xl shadow-blue-100 hover:bg-blue-700 active:scale-95 transition-all"
            >
              确认保存
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataSourceModal;
