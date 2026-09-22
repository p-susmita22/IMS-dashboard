import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Lock, Mail, ArrowRight, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';

export const Login = ({ allowedRole }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      showToast('Please enter both email and password', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await login(email, password);
      if (res.success) {
        if (allowedRole === 'STAFF' && res.user.role !== 'STAFF') {
          logout();
          showToast(`Access Denied: You must be Staff to log in here.`, 'error');
          return;
        }
        showToast(`Welcome back, ${res.user.name}!`, 'success');
        navigate('/');
      } else {
        showToast(res.message || 'Login failed', 'error');
      }
    } catch (err) {
      showToast(
        err.response?.data?.message || 'Invalid credentials or server unavailable',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-xl shadow-emerald-600/30">
            <Package className="w-8 h-8" />
          </div>
        </div>
        <h2 className="text-center text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          {allowedRole === 'ADMIN' ? 'Admin Portal' : 'Staff Portal'}
        </h2>
        <p className="mt-1.5 text-center text-sm text-slate-400">
          StockFlow IMS {allowedRole === 'ADMIN' ? 'Management' : 'Operations'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 relative z-10">
        <div className="bg-white py-8 px-6 shadow-2xl rounded-3xl sm:px-10 border border-slate-100">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <Input
              label="Work Email"
              name="email"
              type="email"
              placeholder="name@ims.com"
              icon={Mail}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              label="Password"
              name="password"
              type="password"
              placeholder="••••••••"
              icon={Lock}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Button
              type="submit"
              variant="brand"
              size="lg"
              loading={loading}
              className="w-full mt-2"
            >
              Sign In <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </form>

          {/* Quick Demo Fill Buttons */}
          <div className="mt-6 pt-6 border-t border-slate-100">
            <div className="flex items-center gap-1.5 mb-3 text-slate-500 text-xs font-semibold">
              <Shield className="w-3.5 h-3.5" />
              <span>Instant 1-Click Demo Login</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {(allowedRole === 'ADMIN' || !allowedRole) && (
                <button
                  type="button"
                  onClick={() => handleQuickFill('admin@ims.com', 'admin123')}
                  className="px-2.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors text-center"
                >
                  Admin
                </button>
              )}

              <button
                type="button"
                onClick={() => handleQuickFill('staff@ims.com', 'staff123')}
                className="px-2.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors text-center"
              >
                Staff
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
