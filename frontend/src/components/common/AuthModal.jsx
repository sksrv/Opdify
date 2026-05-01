'use client';
import { useState } from 'react';
import { X, Phone, Lock, User, Stethoscope, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function AuthModal({ onClose, onSuccess, redirectTo }) {
  const { login, register } = useAuth();
  const router = useRouter();
  const [mode, setMode]       = useState('login');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({ name:'', phone:'', password:'', role:'patient', specialization:'' });
  const set = (k,v) => setForm(f => ({...f,[k]:v}));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.phone || form.phone.length !== 10) { toast.error('Enter a valid 10-digit phone number'); return; }
    if (!form.password || form.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    if (mode === 'register' && !form.name.trim()) { toast.error('Name is required'); return; }

    setLoading(true);
    try {
      if (mode === 'login') {
        const data = await login(form.phone, form.password);
        toast.success(`Welcome back, ${data.user.name.split(' ')[0]}! 👋`);
        onSuccess?.();
        onClose();
        if (redirectTo) router.push(redirectTo);
        else if (data.user.role === 'doctor') router.push('/doctor/dashboard');
      } else {
        await register({ name: form.name, phone: form.phone, password: form.password, role: form.role, specialization: form.specialization });
        toast.success('Account created! Welcome to Opdify 🎉');
        onSuccess?.();
        onClose();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || (mode === 'login' ? 'Login failed. Check your credentials.' : 'Registration failed.'));
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="bg-teal-700 px-6 py-6 text-white">
          <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-xl hover:bg-white/20 transition-colors">
            <X size={18} />
          </button>
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
              <span className="font-black text-sm">CQ</span>
            </div>
            <span className="font-black text-lg">Opdify</span>
          </div>
          <h2 className="text-2xl font-black">{mode === 'login' ? 'Welcome back' : 'Create account'}</h2>
          <p className="text-teal-200 text-sm mt-1">
            {mode === 'login' ? 'Sign in to track your queue & appointments' : 'Join thousands using Opdify'}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100">
          {[['login','Sign In'],['register','Register']].map(([m,l]) => (
            <button key={m} onClick={() => setMode(m)}
              className={`flex-1 py-3.5 text-sm font-bold transition-colors ${mode === m ? 'text-teal-700 border-b-2 border-teal-600' : 'text-slate-500 hover:text-slate-700'}`}>
              {l}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {mode === 'register' && (
            <div>
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5 block">Full Name *</label>
              <div className="relative">
                <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" placeholder="Your full name" value={form.name} onChange={e => set('name',e.target.value)}
                  className="w-full h-12 pl-10 pr-4 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-400 transition-all" required />
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5 block">Phone Number *</label>
            <div className="relative">
              <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="tel" placeholder="10-digit mobile" maxLength={10} value={form.phone}
                onChange={e => set('phone',e.target.value.replace(/\D/g,''))}
                className="w-full h-12 pl-10 pr-4 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-400 transition-all" required />
            </div>
          </div>

          <div>
            <label className="text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5 block">Password *</label>
            <div className="relative">
              <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type={showPass?'text':'password'} placeholder={mode==='register'?'Min 6 characters':'••••••••'}
                value={form.password} onChange={e => set('password',e.target.value)}
                className="w-full h-12 pl-10 pr-12 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-400 transition-all" required />
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1">
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {mode === 'register' && (
            <div>
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5 block">I am a</label>
              <div className="grid grid-cols-2 gap-2">
                {[['patient','Patient',User],['doctor','Doctor',Stethoscope]].map(([v,l,Icon]) => (
                  <button key={v} type="button" onClick={() => set('role',v)}
                    className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-bold transition-all ${form.role===v ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                    <Icon size={15} /> {l}
                  </button>
                ))}
              </div>
            </div>
          )}

          {mode === 'register' && form.role === 'doctor' && (
            <div>
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5 block">Specialization</label>
              <div className="relative">
                <Stethoscope size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" placeholder="e.g. General Physician" value={form.specialization}
                  onChange={e => set('specialization',e.target.value)}
                  className="w-full h-12 pl-10 pr-4 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-400 transition-all" />
              </div>
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full h-13 py-3.5 bg-teal-700 text-white font-black rounded-2xl hover:bg-teal-800 transition-colors flex items-center justify-center gap-2 text-base disabled:opacity-50 mt-2">
            {loading
              ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <>{mode === 'login' ? 'Sign In' : 'Create Account'} <ArrowRight size={18} /></>}
          </button>

          {mode === 'login' && (
            <p className="text-center text-xs text-slate-500">
              No account?{' '}
              <button type="button" onClick={() => setMode('register')} className="text-teal-600 font-bold hover:underline">
                Register here
              </button>
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
