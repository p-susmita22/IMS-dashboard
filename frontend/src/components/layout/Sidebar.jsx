import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Boxes,
  PlusCircle,
  MinusCircle,
  ArrowLeftRight,
  RotateCcw,
  SlidersHorizontal,
  ShoppingCart,
  Users2,
  Building2,
  BarChart3,
  UserCheck,
  Settings as SettingsIcon,
  LogOut,
  X,
  Package,
  Trash2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout, isAdmin, isStaff } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    const role = user?.role;
    logout();
    navigate(role === 'ADMIN' ? '/admin' : '/staff');
  };

  const navItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['ADMIN', 'STAFF'] },
    
    // Inventory Group
    { header: 'INVENTORY' },
    { label: 'Products', path: '/products', icon: Boxes, roles: ['ADMIN', 'STAFF'] },
    { label: 'Add Stock', path: '/add-stock', icon: PlusCircle, roles: ['ADMIN', 'STAFF'], badge: '+' },
    { label: 'Stock Out', path: '/stock-out', icon: MinusCircle, roles: ['ADMIN', 'STAFF'], badge: '-' },
    { label: 'Returns', path: '/returns', icon: RotateCcw, roles: ['ADMIN', 'STAFF'] },
    { label: 'Adjustments', path: '/adjustments', icon: SlidersHorizontal, roles: ['ADMIN', 'STAFF'] },

    // Fulfillment & Directory Group
    { header: 'MANAGEMENT' },
    { label: 'Orders', path: '/orders', icon: ShoppingCart, roles: ['ADMIN', 'STAFF'] },
    { label: 'Vendors', path: '/vendors', icon: Users2, roles: ['ADMIN', 'STAFF'] },
    { label: 'Locations', path: '/locations', icon: Building2, roles: ['ADMIN', 'STAFF'] },

    // Admin & Analytics
    { header: 'SYSTEM' },
    { label: 'Reports', path: '/reports', icon: BarChart3, roles: ['ADMIN'] },
    { label: 'Users', path: '/users', icon: UserCheck, roles: ['ADMIN'] },
    { label: 'Trash Bin', path: '/trash', icon: Trash2, roles: ['ADMIN', 'STAFF'] },
    { label: 'Settings', path: '/settings', icon: SettingsIcon, roles: ['ADMIN'] },
  ];

  const filteredNav = navItems.filter((item) => {
    if (item.header) return true;
    if (!item.roles) return true;
    return item.roles.includes(user?.role);
  });

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800/80 text-slate-600 dark:text-slate-300 flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Logo Header */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-black shadow-md shadow-emerald-600/30">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <span className="text-base font-bold text-slate-900 dark:text-white tracking-tight">StockFlow</span>
              <span className="text-[10px] uppercase tracking-wider block text-emerald-400 font-semibold -mt-0.5">
                Wholesale IMS
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
            title="Close Sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {filteredNav.map((item, idx) => {
            if (item.header) {
              return (
                <div
                  key={idx}
                  className="px-3 pt-4 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500"
                >
                  {item.header}
                </div>
              );
            }

            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => onClose && onClose()}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-emerald-50 dark:bg-emerald-600 text-emerald-700 dark:text-white shadow-sm shadow-emerald-600/10 dark:shadow-emerald-600/20 font-semibold'
                      : 'text-slate-500 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-900/90'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-xs font-bold px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* User Footer Profile */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800/80 shrink-0">
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-slate-800 flex items-center justify-center font-bold text-xs text-emerald-700 dark:text-white uppercase shrink-0">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-700 dark:text-white truncate">{user?.name}</p>
                <span className="inline-block text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">
                  {user?.role}
                </span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:text-rose-400 dark:hover:bg-slate-800 transition-colors shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
