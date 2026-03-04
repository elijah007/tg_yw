
import React, { useState, useEffect } from 'react';
import { AppType, Announcement } from './types';
import Layout from './components/Layout';
import Portal from './apps/Portal';
import DatabaseManager from './apps/DatabaseManager';
import ServerManager from './apps/ServerManager';
import LogCenter from './apps/LogCenter';

const App: React.FC = () => {
  const [activeApp, setActiveApp] = useState<AppType>(AppType.PORTAL);
  const user = { real_name: '高级运维' };

  return (
    <Layout activeApp={activeApp} onNavigate={setActiveApp} userName={user.real_name}>
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
