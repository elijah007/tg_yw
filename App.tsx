
import React, { useState, useEffect } from 'react';
import { AppType, Announcement } from './types';
import Layout from './components/Layout';
import Portal from './apps/Portal';
import DatabaseManager from './apps/DatabaseManager';
import ServerManager from './apps/ServerManager';
import LogCenter from './apps/LogCenter';

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
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;

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
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 font-['Noto_Sans_SC']">
        <div className="w-full max-w-md bg-white rounded-[40px] p-12 shadow-2xl animate-in zoom-in-95 duration-300 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
          
          <div className="text-center mb-12 relative z-10">
            <div className="w-24 h-24 bg-blue-600 rounded-[32px] mx-auto flex items-center justify-center mb-8 shadow-2xl shadow-blue-500/30 transform rotate-12 group hover:rotate-0 transition-transform duration-500">
               <span className="text-white text-4xl font-black">天工</span>
            </div>
            <h1 className="text-4xl font-black text-slate-800 tracking-tighter">中枢元数据认证</h1>
            <p className="text-slate-400 mt-3 font-bold uppercase tracking-widest text-[10px]">Tiangong Central Authentication System</p>
          </div>

          <form className="space-y-6 relative z-10" onSubmit={handleLogin}>
            {loginError && (
              <div className="p-5 bg-red-50 border border-red-100 text-red-600 text-xs font-black rounded-2xl animate-bounce">
                {loginError}
              </div>
            )}
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">管理账号 (Master ID)</label>
              <input 
                name="username"
                type="text" 
                defaultValue="Admin"
                className="w-full px-6 py-5 border border-slate-100 rounded-2xl bg-slate-50 focus:ring-4 ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold text-slate-700"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">安全密钥 (Secure Pass)</label>
              <input 
                name="password"
                type="password" 
                defaultValue="admin123"
                className="w-full px-6 py-5 border border-slate-100 rounded-2xl bg-slate-50 focus:ring-4 ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold"
                required
              />
            </div>
            <button 
              type="submit"
              disabled={isLoggingIn}
              className="w-full bg-slate-900 hover:bg-blue-600 text-white font-black py-6 rounded-3xl shadow-2xl shadow-slate-900/10 transition-all active:scale-95 disabled:opacity-50 mt-4 group"
            >
              {isLoggingIn ? '同步中枢指令...' : '初始化连接'}
            </button>
          </form>
          
          <div className="mt-12 pt-8 border-t border-slate-50 flex justify-between text-[10px] font-black text-slate-300 uppercase tracking-widest">
            <span className="hover:text-blue-500 cursor-help">密码重置</span>
            <span>Release v2.8.5-LTS</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Layout activeApp={activeApp} onNavigate={setActiveApp} userName={user?.real_name || '高级运维'}>
      {activeApp === AppType.PORTAL && <Portal onSelectApp={setActiveApp} />}
      {activeApp === AppType.DATABASE_MANAGER && <DatabaseManager />}
      {activeApp === AppType.SERVER_MANAGER && <ServerManager />}
      {activeApp === AppType.LOG_CENTER && <LogCenter />}

      {activeApp !== AppType.PORTAL && activeApp !== AppType.DATABASE_MANAGER && 
       activeApp !== AppType.SERVER_MANAGER && activeApp !== AppType.LOG_CENTER && (
        <div className="flex flex-col items-center justify-center h-full p-20 text-center animate-in fade-in zoom-in-95 duration-700">
           <div className="w-32 h-32 bg-slate-100 rounded-full flex items-center justify-center mb-10 border-4 border-white shadow-xl">
              <span className="text-6xl animate-pulse">🏗️</span>
           </div>
           <h2 className="text-4xl font-black text-slate-800 mb-4 uppercase tracking-tighter italic">模块正在装载</h2>
           <p className="text-slate-400 font-bold mb-10 max-w-sm uppercase tracking-widest text-xs leading-relaxed">
             The requested sub-system is currently establishing a grpc channel to the cluster core.
           </p>
           <button 
             onClick={() => setActiveApp(AppType.PORTAL)}
             className="px-12 py-5 bg-blue-600 text-white rounded-3xl font-black shadow-2xl shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95"
           >
             返回天工中枢
           </button>
        </div>
      )}
    </Layout>
  );
};

export default App;
