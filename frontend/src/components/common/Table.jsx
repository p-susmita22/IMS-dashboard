import React from 'react';

export const Table = ({ headers = [], children, className = '' }) => {
  return (
    <div className={`overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}>
      <table className="w-full text-left border-collapse text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-slate-600">
            {headers.map((h, idx) => (
              <th key={idx} className="px-5 py-3.5 whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-slate-700 font-normal">
          {children}
        </tbody>
      </table>
    </div>
  );
};
