import React from 'react';
import { PackageOpen } from 'lucide-react';
import { Button } from './Button';

export const EmptyState = ({
  icon: Icon = PackageOpen,
  title = 'No records found',
  description = 'There are no items matching your criteria right now.',
  actionText,
  onAction,
  className = ''
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center bg-white rounded-2xl border border-dashed border-slate-200 ${className}`}>
      <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 mb-4 border border-slate-100">
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="text-base font-bold text-slate-900 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 max-w-sm mb-5">{description}</p>
      {actionText && onAction && (
        <Button onClick={onAction} variant="secondary" size="md">
          {actionText}
        </Button>
      )}
    </div>
  );
};
