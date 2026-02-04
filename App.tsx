
import React, { useState, useEffect } from 'react';
import { AppType, Announcement } from './types';
import { INITIAL_ANNOUNCEMENTS } from './constants';
import Layout from './components/Layout';
import Portal from './apps/Portal';
import DatabaseManager from './apps/DatabaseManager';

const App: React.FC = () => {
  const [activeApp, setActiveApp] = useState<AppType>(AppType.PORTAL);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);
    
    const formData = new FormData(e.currentTarget);
    const username = formData.get('username');
    const password = formData.get('password');

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      
      if (data.success) {
        setUser(data.user);
        setIsLoggedIn(true);
      } else {
        setLoginError(data.error || '登录失败，请检查账号密码');
      }
    } catch (err) {
      setLoginError('无法连接到认证服务器');
    } finally {
      setIsLoggingIn(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white rounded-3xl p-10 shadow-2xl animate-in zoom-in-95 duration-300">
          <div className="text-center mb-10">
            <div className="w-20 h-20 bg-blue-600 rounded-[24px] mx-auto flex items-center justify-center mb-6 shadow-2xl shadow-blue-500/20">
               <span className="text-white text-3xl font-black">天工</span>
            </div>
            <h1 className="text-3xl font-black text-slate-800">元数据认证</h1>
            <p className="text-slate-400 mt-2 font-medium">Ops Platform Authentication</p>
          </div>

          <form className="space-y-6" onSubmit={handleLogin}>
            {loginError && (
              <div className="p-4 bg-red-50 border border-red-100 text-red-600 text-sm font-bold rounded-xl animate-shake">
                {loginError}
              </div>
            )}
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">管理账号</label>
              <input 
                name="username"
                type="text" 
                className="w-full px-5 py-4 border border-slate-200 rounded-2xl bg-slate-50 focus:ring-4 ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold"
                placeholder="请输入账号"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">安全密码</label>
              <input 
                name="password"
                type="password" 
                className="w-full px-5 py-4 border border-slate-200 rounded-2xl bg-slate-50 focus:ring-4 ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold"
                placeholder="••••••••"
                required
              />
            </div>
            <button 
              type="submit"
              disabled={isLoggingIn}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-5 rounded-2xl shadow-xl shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-50"
            >
              {isLoggingIn ? '身份校验中...' : '立即登录'}
            </button>
          </form>
          
          <div className="mt-10 pt-8 border-t border-slate-50 flex justify-between text-[10px] font-black text-slate-300 uppercase tracking-widest">
            <a href="#" className="hover:text-blue-500 transition-colors">密码找回</a>
            <span>Build v2.6.0-stable</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Layout activeApp={activeApp} onNavigate={setActiveApp} userName={user?.real_name || '未知用户'}>
      {activeApp === AppType.PORTAL && (
        <Portal onSelectApp={setActiveApp} />
      )}
      
      {activeApp === AppType.DATABASE_MANAGER && (
        <DatabaseManager />
      )}

      {activeApp !== AppType.PORTAL && activeApp !== AppType.DATABASE_MANAGER && (
        <div className="flex flex-col items-center justify-center h-full p-20 text-center animate-pulse">
           <div className="bg-slate-100 p-10 rounded-full mb-8">
              <span className="text-7xl">🏗️</span>
           </div>
           <h2 className="text-3xl font-black text-slate-800 mb-3 uppercase tracking-tighter">模块建设中</h2>
           <p className="text-slate-400 font-medium mb-10 max-w-sm">该子系统正在同步元数据并建立连接池，请稍后再试。</p>
           <button 
             onClick={() => setActiveApp(AppType.PORTAL)}
             className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black shadow-2xl hover:bg-slate-800 transition-all"
           >
             返回中枢门户
           </button>
        </div>
      )}
    </Layout>
  );
};

export default App;
