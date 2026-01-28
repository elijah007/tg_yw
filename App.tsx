
import React, { useState } from 'react';
import { AppType, Announcement } from './types';
import { INITIAL_ANNOUNCEMENTS } from './constants';
import Layout from './components/Layout';
import Portal from './apps/Portal';
import DatabaseManager from './apps/DatabaseManager';

const App: React.FC = () => {
  const [activeApp, setActiveApp] = useState<AppType>(AppType.PORTAL);
  const [announcements] = useState<Announcement[]>(INITIAL_ANNOUNCEMENTS);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState({ name: '运维总监-王工', role: 'admin' });

  // Simple mock login
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-xl">
               <span className="text-white text-2xl font-black">天工</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-800">平台登录验证</h1>
            <p className="text-slate-400 mt-2 italic">欢迎回来，请验证您的身份</p>
          </div>

          <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); setIsLoggedIn(true); }}>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">管理账号</label>
              <input 
                type="text" 
                className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 ring-blue-500 outline-none transition-all"
                placeholder="Admin"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">安全密码</label>
              <input 
                type="password" 
                className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 ring-blue-500 outline-none transition-all"
                placeholder="••••••••"
                required
              />
            </div>
            <button 
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-200 transition-all active:scale-95"
            >
              登 录
            </button>
          </form>
          
          <div className="mt-8 pt-8 border-t border-slate-100 flex justify-between text-xs text-slate-400">
            <a href="#" className="hover:text-blue-500">忘记密码?</a>
            <span>版本 v2.5.4</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Layout activeApp={activeApp} onNavigate={setActiveApp} userName={user.name}>
      {activeApp === AppType.PORTAL && (
        <Portal 
          onSelectApp={setActiveApp} 
          announcements={announcements} 
        />
      )}
      
      {activeApp === AppType.DATABASE_MANAGER && (
        <DatabaseManager />
      )}

      {activeApp !== AppType.PORTAL && activeApp !== AppType.DATABASE_MANAGER && (
        <div className="flex flex-col items-center justify-center h-full p-20 text-center animate-pulse">
           <div className="bg-slate-100 p-8 rounded-full mb-6">
              <span className="text-6xl text-slate-300">🏗️</span>
           </div>
           <h2 className="text-2xl font-bold text-slate-800 mb-2">建设中...</h2>
           <p className="text-slate-500 mb-8">该模块正在加紧集成，敬请期待。</p>
           <button 
             onClick={() => setActiveApp(AppType.PORTAL)}
             className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold"
           >
             返回门户
           </button>
        </div>
      )}
    </Layout>
  );
};

export default App;
