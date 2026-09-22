import React from 'react';

export const Badge = ({ children, variant = 'neutral', size = 'md', className = '' }) => {
  const variants = {
    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    info: 'bg-blue-50 text-blue-700 border-blue-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200'
  };

  const sizes = {
    sm: 'text-[11px] px-2 py-0.5 font-semibold',
    md: 'text-xs px-2.5 py-1 font-semibold',
    lg: 'text-sm px-3 py-1.5 font-bold'
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border ${variants[variant] || variants.neutral} ${sizes[size]} ${className}`}
    >
      {children}
    </span>
  );
};

export const StockStatusBadge = ({ available, minimumStock }) => {
  if (available === 0) {
    return (
      <Badge variant="danger" size="sm">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
        OUT OF STOCK
      </Badge>
    );
  }
  if (available <= minimumStock) {
    return (
      <Badge variant="warning" size="sm">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
        LOW STOCK ({available})
      </Badge>
    );
  }
  return (
    <Badge variant="success" size="sm">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
      IN STOCK ({available})
    </Badge>
  );
};

export const OrderStatusBadge = ({ status }) => {
  const map = {
    NEW: { variant: 'info', label: 'NEW' },
    CONFIRMED: { variant: 'purple', label: 'CONFIRMED' },
    PACKED: { variant: 'warning', label: 'PACKED' },
    DISPATCHED: { variant: 'indigo', label: 'DISPATCHED' },
    DELIVERED: { variant: 'success', label: 'DELIVERED' },
    CANCELLED: { variant: 'danger', label: 'CANCELLED' },
    RETURNED: { variant: 'neutral', label: 'RETURNED' }
  };

  const conf = map[status] || { variant: 'neutral', label: status };

  return (
    <Badge variant={conf.variant} size="sm">
      {conf.label}
    </Badge>
  );
};
