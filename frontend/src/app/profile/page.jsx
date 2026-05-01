'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Camera, Edit3, Save, X, Calendar, Clock, ChevronRight,
  CheckCircle2, AlertCircle, SkipForward, Phone, MapPin,
  LayoutDashboard, LogOut, User, Hash,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import api from '../../lib/api.js';
import toast from 'react-hot-toast';

const STATUS_CFG = {
  waiting:     { label: 'Waiting',     cls: 'bg-slate-100 text-slate-600'    },
  be_ready:    { label: 'Be Ready',    cls: 'bg-amber-100 text-amber-700'    },
  in_progress: { label: 'Your Turn',   cls: 'bg-teal-100 text-teal-700'      },
  completed:   { label: 'Completed',   cls: 'bg-green-100 text-green-700'    },
  skipped:     { label: 'Skipped',     cls: 'bg-orange-100 text-orange-700'  },
  missed:      { label: 'Missed',      cls: 'bg-red-100 text-red-600'        },
  cancelled:   { label: 'Cancelled',   cls: 'bg-slate-100 text-slate-500'    },
};

function AptCard({ apt, onCancel }) {
  const doc = apt.doctorId;
  const cfg = STATUS_CFG[apt.status] || STATUS_CFG.waiting;
  const active = ['waiting','be_ready','in_progress'].includes(apt.status);

  return (
    <div className={`bg-white rounded-2xl border ${active ? 'border-teal-200' : 'border-slate-100'} p-4`}>
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-100 to-teal-200 flex items-center justify-center flex-shrink-0 text-teal-700 font-black text-xl">
          {doc?.name?.charAt(0) || '?'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-bold text-slate-900 truncate">{doc?.name}</p>
              <p className="text-xs text-teal-600 font-semibold">{doc?.specialization}</p>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${cfg.cls}`}>{cfg.label}</span>
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-500">
            <span className="flex items-center gap-1"><Calendar size={10} />{apt.date}</span>
            <span className="flex items-center gap-1"><Hash size={10} />Token #{apt.tokenNumber}</span>
            {doc?.clinicName && <span className="flex items-center gap-1 max-w-[140px]"><MapPin size={10} /><span className="truncate">{doc.clinicName}</span></span>}
          </div>
        </div>
      </div>
      {active && (
        <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
          <Link href={`/queue/${apt._id}`}
            className="flex-1 h-9 bg-teal-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 hover:bg-teal-800 transition-colors">
            <Clock size={13} /> Track Live Queue
          </Link>
          <button onClick={() => onCancel(apt._id)}
            className="h-9 px-3 text-xs font-bold text-red-600 border border-red-200 rounded-xl hover:bg-red-50 transition-colors">
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

export default function ProfilePage() {
  const { user, loading: authLoading, updateProfile, logout, isDoctor } = useAuth();
  const router = useRouter();
  const fileRef = useRef();

  const [appointments, setApts] = useState([]);
  const [aptsLoading, setAptsLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [filter, setFilter] = useState('active');
  const [form, setForm] = useState({ name: '', email: '' });

  useEffect(() => {
    if (!authLoading && !user) { router.push('/'); return; }
    if (user) {
      setForm({ name: user.name || '', email: user.email || '' });
      api.get('/appointments/my?limit=30').then(({ data }) => setApts(data.data || [])).finally(() => setAptsLoading(false));
    }
  }, [user, authLoading]);

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Max 5MB'); return; }
    setUploading(true);
    const fd = new FormData();
    fd.append('avatar', file);
    try {
      await api.post('/upload/avatar', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Photo updated!');
      window.location.reload();
    } catch { toast.error('Upload failed'); }
    finally { setUploading(false); }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile({ name: form.name.trim(), email: form.email.trim() });
      setEditing(false);
      toast.success('Profile updated!');
    } catch { toast.error('Update failed'); }
    finally { setSaving(false); }
  };

  const handleCancel = async (id) => {
    if (!confirm('Cancel this appointment?')) return;
    try {
      await api.patch(`/appointments/${id}/cancel`);
      setApts(prev => prev.map(a => a._id === id ? { ...a, status: 'cancelled' } : a));
      toast.success('Appointment cancelled');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleLogout = () => { logout(); router.push('/'); };

  if (authLoading || !user) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
    </div>
  );

  const upcoming = appointments.filter(a => ['waiting','be_ready','in_progress'].includes(a.status));
  const past     = appointments.filter(a => ['completed','missed','cancelled','skipped'].includes(a.status));
  const shown    = filter === 'active' ? upcoming : filter === 'past' ? past : appointments;

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="max-w-2xl mx-auto px-4 pt-6 space-y-5">

        {/* PROFILE CARD */}
        <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden">
          <div className="h-24 bg-gradient-to-br from-teal-600 to-teal-900" />
          <div className="px-5 pb-5">
            <div className="flex items-end justify-between -mt-10 mb-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl border-4 border-white shadow-md overflow-hidden bg-gradient-to-br from-teal-400 to-teal-700">
                  {user.avatar
                    ? <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-white font-black text-3xl">{user.name?.charAt(0)}</div>}
                </div>
                <button onClick={() => fileRef.current?.click()} disabled={uploading}
                  className="absolute -bottom-1 -right-1 w-7 h-7 bg-teal-700 rounded-lg flex items-center justify-center text-white shadow-md hover:bg-teal-800 transition-colors disabled:opacity-50">
                  {uploading ? <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Camera size={12} />}
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              </div>

              <div className="flex items-center gap-2">
                {isDoctor && (
                  <Link href="/doctor/dashboard"
                    className="flex items-center gap-1.5 h-8 px-3 text-xs font-bold text-teal-700 border border-teal-200 rounded-xl hover:bg-teal-50 transition-colors">
                    <LayoutDashboard size={13} /> Dashboard
                  </Link>
                )}
                <button onClick={handleLogout}
                  className="flex items-center gap-1.5 h-8 px-3 text-xs font-bold text-red-600 border border-red-200 rounded-xl hover:bg-red-50 transition-colors">
                  <LogOut size={13} /> Sign Out
                </button>
              </div>
            </div>

            {editing ? (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Name</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full h-10 px-3.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-400" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Email</label>
                  <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="your@email.com"
                    className="w-full h-10 px-3.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-400" />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setEditing(false)} className="flex-1 h-10 text-sm font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">Cancel</button>
                  <button onClick={handleSave} disabled={saving}
                    className="flex-1 h-10 text-sm font-bold bg-teal-700 text-white rounded-xl hover:bg-teal-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                    {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save size={14} /> Save</>}
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-black text-slate-900">{user.name}</h2>
                    <span className="text-xs font-bold text-teal-600 bg-teal-50 px-2.5 py-0.5 rounded-full capitalize">{user.role}</span>
                  </div>
                  <button onClick={() => setEditing(true)}
                    className="flex items-center gap-1.5 h-8 px-3 text-xs font-bold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                    <Edit3 size={12} /> Edit
                  </button>
                </div>
                <div className="mt-3 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Phone size={13} className="text-teal-500" /> {user.phone}
                  </div>
                  {user.email && <div className="flex items-center gap-2 text-sm text-slate-600">
                    <span className="text-teal-500">@</span> {user.email}
                  </div>}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* APPOINTMENTS */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-black text-slate-900">My Appointments</h3>
            <div className="flex bg-slate-100 rounded-xl p-0.5 text-xs font-bold">
              {[['active','Active'],['past','Past'],['all','All']].map(([v,l]) => (
                <button key={v} onClick={() => setFilter(v)}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${filter === v ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          {aptsLoading ? (
            <div className="space-y-3">{[...Array(3)].map((_,i) => <div key={i} className="bg-white rounded-2xl border border-slate-100 p-4 h-24 animate-pulse" />)}</div>
          ) : shown.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center">
              <Calendar size={32} className="text-slate-200 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-400">No appointments found</p>
              <Link href="/search" className="mt-3 inline-flex h-9 px-4 text-xs font-bold bg-teal-700 text-white rounded-xl hover:bg-teal-800 transition-colors items-center gap-1.5">
                Find Doctors
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {shown.map(apt => <AptCard key={apt._id} apt={apt} onCancel={handleCancel} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
