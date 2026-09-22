import React from 'react';
import { Loader2 } from 'lucide-react';

export const Button = ({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon: Icon,
  className = '',
  onClick,
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center justify-center font-medium rounded-xl transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.99]';

  const variants = {
    primary:
      'bg-slate-900 text-white hover:bg-slate-800 focus:ring-slate-900 shadow-sm',
    brand:
      'bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-600 shadow-sm shadow-emerald-600/20',
    secondary:
      'bg-slate-100 text-slate-800 hover:bg-slate-200 focus:ring-slate-400',
    outline:
      'border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 focus:ring-slate-400',
    danger:
      'bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-600 shadow-sm shadow-rose-600/20',
    ghost:
      'text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:ring-slate-300'
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2.5 gap-2',
    lg: 'text-base px-5 py-3 gap-2.5 min-h-[46px]', // Large for mobile touch target
    icon: 'p-2.5 rounded-xl'
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
      ) : Icon ? (
        <Icon className="w-4 h-4 shrink-0" />
      ) : null}
      {children}
    </button>
  );
};
