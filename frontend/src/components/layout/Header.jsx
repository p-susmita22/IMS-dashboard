import React from 'react';
import { Menu, Warehouse, Shield, Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Header = ({ onOpenSidebar, isSidebarOpen }) => {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-30 h-16 py-2 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm px-4 sm:px-6 flex items-center justify-between transition-all">
      {/* Mobile Menu & Title */}
      <div className="flex items-center gap-4">
        {!isSidebarOpen && (
          <button
            onClick={onOpenSidebar}
            className="p-3 rounded-xl bg-slate-50 text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 border border-slate-200 hover:border-emerald-200 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            title="Toggle Menu"
          >
            <Menu className="w-6 h-6" />
          </button>
        )}
        
        <div className={`hidden sm:flex items-center gap-3 ${!isSidebarOpen ? 'pl-4 border-l border-slate-200' : ''}`}>
          <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <Warehouse className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 leading-tight">StockFlow Workspace</h2>
            <p className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">Multi-Warehouse Inventory</p>
          </div>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4 sm:gap-6">
        <button className="p-2 text-slate-400 hover:text-emerald-600 transition-colors relative cursor-pointer" title="Notifications">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 border-2 border-white"></span>
        </button>

        <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>

        <div className="flex items-center gap-3">
          {/* User Greeting */}
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-slate-900 leading-tight">{user?.name}</p>
            <p className="text-[11px] font-semibold text-slate-500 leading-tight">{user?.email}</p>
          </div>

          {/* User Role Badge */}
          <div className="flex items-center justify-center h-10 px-3.5 rounded-xl bg-slate-900 text-white shadow-md shadow-slate-900/20 cursor-default">
            <Shield className="w-3.5 h-3.5 text-emerald-400 mr-2" />
            <span className="text-xs font-bold uppercase tracking-wider">{user?.role || 'USER'}</span>
          </div>
        </div>
      </div>
    </header>
  );
};
