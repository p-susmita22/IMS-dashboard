import React from 'react';
import { Settings as SettingsIcon, ShieldCheck, CheckCircle2, Lock, Database } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Settings = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <SettingsIcon className="w-7 h-7 text-slate-700" />
          System Rules & Configuration
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Core inventory safety invariants and wholesale configuration.
        </p>
      </div>

      {/* Strict Stock Invariants Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-2 text-emerald-700 font-bold text-base">
          <ShieldCheck className="w-6 h-6 text-emerald-600" />
          <span>Core Stock Safety Rules Enforced by System Engine</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-900 block">No Direct Stock Modification</strong>
              <span className="text-slate-500">
                Staff cannot arbitrarily change numbers. All stock changes occur strictly via Stock In, Stock Out, Transfer, Return, or Adjustment.
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-900 block">Permanent Auditable Movements</strong>
              <span className="text-slate-500">
                Every transaction logs previous and new quantities, timestamp, user, reference, and reason. Transaction history cannot be deleted.
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-900 block">Oversell Prevention</strong>
              <span className="text-slate-500">
                Physical stock cannot become negative. Stock outs and transfers are blocked if requested quantity exceeds available stock.
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-900 block">Reservation & Damaged Isolation</strong>
              <span className="text-slate-500">
                Confirmed orders hold reservations without physical deduction until dispatched. Damaged returns do not re-enter available stock.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
