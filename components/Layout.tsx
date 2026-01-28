
import React from 'react';
import { Menu, Bell, User, LogOut, ChevronRight, Home } from 'lucide-react';
import { AppType } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeApp: AppType;
  onNavigate: (app: AppType) => void;
  userName: string;
}

const Layout: React.FC<LayoutProps> = ({ children, activeApp, onNavigate, userName }) => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center space-x-4">
          <div 
            className="flex items-center space-x-2 cursor-pointer group" 
            onClick={() => onNavigate(AppType.PORTAL)}
          >
            <div className="bg-blue-600 p-2 rounded-lg group-hover:bg-blue-700 transition-colors">
              <Home className="text-white w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">天工综合运维管理平台</h1>
          </div>
          {activeApp !== AppType.PORTAL && (
            <>
              <ChevronRight className="w-4 h-4 text-slate-400" />
              <span className="text-blue-600 font-medium bg-blue-50 px-3 py-1 rounded-full text-sm">
                {activeApp === AppType.DATABASE_MANAGER ? '数据库管理' : activeApp}
              </span>
            </>
          )}
        </div>

        <div className="flex items-center space-x-6">
          <div className="relative">
            <Bell className="w-5 h-5 text-slate-500 cursor-pointer hover:text-blue-600 transition-colors" />
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">2</span>
          </div>
          <div className="h-6 w-px bg-slate-200"></div>
          <div className="flex items-center space-x-3 cursor-pointer group">
            <div className="text-right">
              <p className="text-sm font-semibold text-slate-700">{userName}</p>
              <p className="text-xs text-slate-400">高级运维专家</p>
            </div>
            <div className="w-9 h-9 bg-slate-200 rounded-full flex items-center justify-center group-hover:ring-2 ring-blue-500 transition-all overflow-hidden">
               <img src={`https://picsum.photos/seed/${userName}/100`} alt="Avatar" />
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-auto">
        {children}
      </main>

      <footer className="bg-white border-t border-slate-200 py-4 px-8 flex justify-between items-center text-slate-400 text-sm">
        <p>&copy; 2024 天工 O&M Platform. All Rights Reserved.</p>
        <div className="flex space-x-4">
          <a href="#" className="hover:text-blue-500">隐私协议</a>
          <a href="#" className="hover:text-blue-500">使用文档</a>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
