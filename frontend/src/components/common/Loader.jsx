import React from 'react';
import { Loader2 } from 'lucide-react';

export const Loader = ({ message = 'Loading...', size = 'md', className = '' }) => {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 ${className}`}>
      <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mb-3" />
      {message && <p className="text-sm font-medium text-slate-500">{message}</p>}
    </div>
  );
};
