'use client';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../lib/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('Opdify_token') : null;
    if (!token) { setLoading(false); return; }
    try {
      const { data } = await api.get('/auth/me');
      setUser(data.user);
      if (data.doctorProfile) setDoctorProfile(data.doctorProfile);
    } catch {
      localStorage.removeItem('Opdify_token');
      localStorage.removeItem('Opdify_user');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchMe();
    const onLogout = () => { setUser(null); setDoctorProfile(null); };
    window.addEventListener('auth:logout', onLogout);
    return () => window.removeEventListener('auth:logout', onLogout);
  }, [fetchMe]);

  const _persist = (token, userData) => {
    localStorage.setItem('Opdify_token', token);
    localStorage.setItem('Opdify_user', JSON.stringify(userData));
    setUser(userData);
  };

  const login = async (phone, password) => {
    const { data } = await api.post('/auth/login', { phone, password });
    _persist(data.token, data.user);
    if (data.doctorProfile) setDoctorProfile(data.doctorProfile);
    return data;
  };

  const register = async (payload) => {
    const { data } = await api.post('/auth/register', payload);
    _persist(data.token, data.user);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('Opdify_token');
    localStorage.removeItem('Opdify_user');
    setUser(null);
    setDoctorProfile(null);
  };

  const updateProfile = async (payload) => {
    const { data } = await api.put('/users/profile', payload);
    setUser(data.data);
    localStorage.setItem('Opdify_user', JSON.stringify(data.data));
    return data;
  };

  return (
    <AuthContext.Provider value={{
      user, doctorProfile, loading, login, register, logout, updateProfile, fetchMe,
      isDoctor: user?.role === 'doctor',
      isAdmin: user?.role === 'admin',
      isLoggedIn: !!user,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};
