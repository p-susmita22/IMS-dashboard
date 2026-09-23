import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/authApi';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('ims_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('ims_token') || '');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('ims_token');
      if (savedToken) {
        try {
          const res = await authApi.getMe();
          if (res.success && res.data) {
            setUser(res.data);
            localStorage.setItem('ims_user', JSON.stringify(res.data));
          }
        } catch (err) {
          console.error('Session restore failed:', err);
          if (err.response && err.response.status === 401) {
            logout();
          }
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    const res = await authApi.login(email, password);
    if (res.success && res.data) {
      const { token: newToken, user: userData } = res.data;
      setToken(newToken);
      setUser(userData);
      localStorage.setItem('ims_token', newToken);
      localStorage.setItem('ims_user', JSON.stringify(userData));
      return { success: true, user: userData };
    }
    return { success: false, message: res.message };
  };

  const logout = () => {
    setUser(null);
    setToken('');
    localStorage.removeItem('ims_token');
    localStorage.removeItem('ims_user');
  };

  const isAdmin = user?.role === 'ADMIN';
  const isStaff = user?.role === 'STAFF';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        isAdmin,
        isStaff
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
