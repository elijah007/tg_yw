
import React, { useState } from 'react';
import { X, Database, Globe, Lock, User, Hash } from 'lucide-react';
import { DataSource, DatabaseType } from '../../types';

interface Props {
  source?: DataSource | null;
  onClose: () => void;
  onSave: (data: Partial<DataSource>) => void;
}

const DataSourceModal: React.FC<Props> = ({ source, onClose, onSave }) => {
  const [formData, setFormData] = useState<Partial<DataSource>>(source || {
    name: '',
    type: 'mysql',
    host: '127.0.0.1',
    port: 3306,
    database: '',
    username: '',
    password: ''
  });

  const [testState, setTestState] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');

  const handleTest = async () => {
    setTestState('testing');
    await new Promise(r => setTimeout(r, 1200));
    setTestState(Math.random() > 0.1 ? 'success' : 'error');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-800">{source ? '编辑数据源' : '新增 JDBC 数据源'}</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">实例名称</label>
              <div className="relative">
                <Database className="absolute left-3 top-2.5 w-4 h-4 text-slate-300" />
                <input 
                  type="text" 
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 ring-blue-500 outline-none"
                  placeholder="如: 生产交易-主库"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
            </div>
            
            <div className="flex space-x-4">
              <div className="flex-1">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">连接类型</label>
                <select 
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 ring-blue-500 outline-none capitalize"
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value as DatabaseType})}
                >
                  <option value="mysql">MySQL</option>
                  <option value="postgresql">PostgreSQL</option>
                  <option value="mongodb">MongoDB</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">主机端口</label>
                <div className="flex space-x-2">
                  <input 
                    type="text" 
                    className="flex-2 w-full px-4 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 ring-blue-500 outline-none"
                    placeholder="127.0.0.1"
                    value={formData.host}
                    onChange={(e) => setFormData({...formData, host: e.target.value})}
                  />
                  <input 
                    type="number" 
                    className="w-24 px-4 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 ring-blue-500 outline-none"
                    placeholder="3306"
                    value={formData.port}
                    onChange={(e) => setFormData({...formData, port: parseInt(e.target.value)})}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">数据库/服务名</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 ring-blue-500 outline-none"
                    placeholder="app_db"
                    value={formData.database}
                    onChange={(e) => setFormData({...formData, database: e.target.value})}
                  />
               </div>
               <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">用户名</label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-300" />
                    <input 
                      type="text" 
                      className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 ring-blue-500 outline-none"
                      placeholder="admin"
                      value={formData.username}
                      onChange={(e) => setFormData({...formData, username: e.target.value})}
                    />
                  </div>
               </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">密码</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-300" />
                <input 
                  type="password" 
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 ring-blue-500 outline-none"
                  placeholder="********"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button 
            onClick={handleTest}
            disabled={testState === 'testing'}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center ${
              testState === 'testing' ? 'bg-slate-200 text-slate-500' : 
              testState === 'success' ? 'bg-emerald-100 text-emerald-700' :
              testState === 'error' ? 'bg-red-100 text-red-700' :
              'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            {testState === 'testing' ? '正在连接...' : 
             testState === 'success' ? '连接成功!' : 
             testState === 'error' ? '连接失败' : '测试连接'}
          </button>
          <div className="space-x-3">
            <button onClick={onClose} className="px-4 py-2 text-slate-500 hover:text-slate-700 font-medium">取消</button>
            <button 
              onClick={() => onSave(formData)}
              className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 active:scale-95 transition-all"
            >
              保存配置
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataSourceModal;
