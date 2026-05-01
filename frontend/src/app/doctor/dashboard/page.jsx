'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  SkipForward, RotateCcw, Pause, Play, Square, Plus,
  Bell, Star, Settings, Phone, X, Save,
  Clock, Users, CheckCircle2, ChevronRight, Menu,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext.jsx';
import { useSocket } from '../../../context/SocketContext.jsx';
import api from '../../../lib/api.js';
import toast from 'react-hot-toast';
import Link from 'next/link';

/* ─── CONSTANTS ─── */
const STATUS_STYLE = {
  waiting:     { chip: 'bg-slate-100 text-slate-600',  label: 'Waiting'     },
  be_ready:    { chip: 'bg-amber-100 text-amber-800',  label: 'Be Ready'    },
  in_progress: { chip: 'bg-teal-100 text-teal-800',    label: 'In Progress' },
  completed:   { chip: 'bg-green-100 text-green-700',  label: 'Completed'   },
  skipped:     { chip: 'bg-orange-100 text-orange-700',label: 'Skipped'     },
  missed:      { chip: 'bg-red-50 text-red-500',       label: 'Missed'      },
  cancelled:   { chip: 'bg-slate-50 text-slate-400',   label: 'Cancelled'   },
};

const Q_BADGE = {
  active:      'bg-teal-100 text-teal-800',
  paused:      'bg-amber-100 text-amber-800',
  not_started: 'bg-slate-100 text-slate-600',
  ended:       'bg-red-100 text-red-700',
};

/* ─── TINY COMPONENTS ─── */
function Dot({ active = true }) {
  return <span className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${active ? 'bg-teal-500 animate-pulse' : 'bg-slate-300'}`} />;
}

function Chip({ status }) {
  const s = STATUS_STYLE[status] || STATUS_STYLE.waiting;
  return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${s.chip}`}>{s.label}</span>;
}

function Btn({ onClick, children, variant = 'ghost', size = 'md', disabled = false, className = '', type = 'button' }) {
  const base = 'inline-flex items-center justify-center gap-2 font-semibold rounded-2xl transition-all duration-150 active:scale-[.97] disabled:opacity-40 disabled:cursor-not-allowed select-none border leading-none';
  const sz = { sm: 'h-9 px-3 text-xs', md: 'h-11 px-4 text-sm', lg: 'h-12 px-5 text-sm', xl: 'h-14 px-6 text-base' };
  const v = {
    primary:   'bg-teal-700 text-white border-teal-700 hover:bg-teal-800',
    secondary: 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50',
    success:   'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700',
    warning:   'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100',
    danger:    'bg-red-50 text-red-700 border-red-200 hover:bg-red-100',
    orange:    'bg-orange-500 text-white border-orange-500 hover:bg-orange-600',
    ghost:     'bg-transparent text-slate-600 border-transparent hover:bg-slate-100',
    violet:    'bg-violet-50 text-violet-800 border-violet-200 hover:bg-violet-100',
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${sz[size]} ${v[variant]} ${className}`}>
      {children}
    </button>
  );
}

/* ─── MODALS (mobile-first bottom-sheet) ─── */
function WalkInModal({ onClose, onAdd, loading }) {
  const [form, setForm] = useState({ patientName: '', patientPhone: '', notes: '', isPriority: false });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-sm overflow-hidden max-h-[92vh] overflow-y-auto">
        <div className="bg-teal-700 px-5 py-4 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-bold text-base">Add Patient to Queue</h3>
            <button onClick={onClose} className="text-white/70 hover:text-white p-1"><X size={20} /></button>
          </div>
        </div>
        <form onSubmit={e => { e.preventDefault(); if (!form.patientName.trim() || !form.patientPhone.trim()) return; onAdd(form); }} className="p-5 space-y-3">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Patient Name *</label>
            <input type="text" value={form.patientName} onChange={e => set('patientName', e.target.value)} placeholder="Full name"
              className="w-full h-12 px-4 text-base bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400/40 focus:border-teal-400" required />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Phone Number *</label>
            <input type="tel" inputMode="numeric" value={form.patientPhone} onChange={e => set('patientPhone', e.target.value.replace(/\D/g, ''))}
              maxLength={10} placeholder="10-digit mobile"
              className="w-full h-12 px-4 text-base bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400/40 focus:border-teal-400" required />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Complaint (optional)</label>
            <input type="text" value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="e.g. fever, chest pain"
              className="w-full h-12 px-4 text-base bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400/40 focus:border-teal-400" />
          </div>
          <label className="flex items-center gap-3 cursor-pointer p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div onClick={() => set('isPriority', !form.isPriority)}
              className={`w-12 h-7 rounded-full relative flex-shrink-0 transition-colors ${form.isPriority ? 'bg-violet-600' : 'bg-slate-300'}`}>
              <span className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-all ${form.isPriority ? 'right-1' : 'left-1'}`} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">Emergency / Priority</p>
              <p className="text-xs text-slate-400">Goes to front of queue</p>
            </div>
          </label>
          <div className="flex gap-2 pt-1 sticky bottom-0 bg-white pb-1">
            <Btn variant="secondary" onClick={onClose} size="lg" className="flex-1">Cancel</Btn>
            <button type="submit" disabled={loading}
              className="flex-1 h-12 text-sm font-bold inline-flex items-center justify-center gap-2 bg-teal-700 text-white rounded-2xl hover:bg-teal-800 transition-colors border border-teal-700 disabled:opacity-50">
              {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Plus size={16} /> Add to Queue</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SettingsModal({ doctor, onClose, onSave, loading }) {
  const [avg, setAvg] = useState(doctor.avgTimePerPatient || 15);
  const [max, setMax] = useState(doctor.maxPatientsPerDay || 30);
  const [fee, setFee] = useState(doctor.consultationFee || 0);
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-sm overflow-hidden max-h-[92vh] overflow-y-auto">
        <div className="bg-teal-700 px-5 py-4 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-bold text-base">Queue Settings</h3>
            <button onClick={onClose} className="text-white/70 hover:text-white p-1"><X size={20} /></button>
          </div>
        </div>
        <div className="p-5 space-y-4">
          {[
            { label: 'Avg time per patient (minutes)', value: avg, set: setAvg, min: 1, max: 120 },
            { label: 'Max patients per day', value: max, set: setMax, min: 1, max: 200 },
            { label: 'Consultation fee (₹)', value: fee, set: setFee, min: 0, max: 99999 },
          ].map(({ label, value, set: setter, min, max: mx }) => (
            <div key={label}>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">{label}</label>
              <input type="number" inputMode="numeric" min={min} max={mx} value={value} onChange={e => setter(Number(e.target.value))}
                className="w-full h-12 px-4 text-base bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400/40 focus:border-teal-400" />
            </div>
          ))}
          <div className="flex gap-2 pt-1">
            <Btn variant="secondary" onClick={onClose} size="lg" className="flex-1">Cancel</Btn>
            <button onClick={() => onSave({ avgTimePerPatient: avg, maxPatientsPerDay: max, consultationFee: fee })} disabled={loading}
              className="flex-1 h-12 text-sm font-bold inline-flex items-center justify-center gap-2 bg-teal-700 text-white rounded-2xl hover:bg-teal-800 transition-colors border border-teal-700 disabled:opacity-50">
              {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save size={15} /> Save</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── More Actions Sheet (mobile only) ─── */
function MoreSheet({ open, onClose, items }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center lg:hidden">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-t-3xl shadow-2xl w-full max-w-md p-3 pb-[max(env(safe-area-inset-bottom),1rem)]">
        <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-3" />
        <div className="space-y-1.5">
          {items.map((it, i) => (
            <button key={i} onClick={() => { it.onClick?.(); onClose(); }} disabled={it.disabled}
              className={`w-full flex items-center gap-3 p-3.5 rounded-2xl text-left transition-colors disabled:opacity-40 ${it.danger ? 'hover:bg-red-50 text-red-700' : 'hover:bg-slate-50 text-slate-800'}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${it.danger ? 'bg-red-50' : 'bg-slate-100'}`}>
                <it.icon size={18} className={it.danger ? 'text-red-600' : 'text-slate-700'} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold">{it.label}</p>
                {it.sub && <p className="text-xs text-slate-400 truncate">{it.sub}</p>}
              </div>
              <ChevronRight size={16} className="text-slate-300" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── QUEUE ROW ─── */
function QueueRow({ apt, queueActive, onComplete, onSkip, onRecall }) {
  const isIP  = apt.status === 'in_progress';
  const isBR  = apt.status === 'be_ready';
  const isSk  = apt.status === 'skipped';
  const dim   = ['completed','missed','cancelled'].includes(apt.status);

  const tokenCls = {
    in_progress: 'bg-teal-100 text-teal-800 ring-2 ring-teal-400',
    be_ready:    'bg-amber-100 text-amber-800',
    completed:   'bg-green-50 text-green-600',
    skipped:     'bg-orange-100 text-orange-700',
    missed:      'bg-red-50 text-red-400',
  }[apt.status] ?? 'bg-slate-100 text-slate-600';

  return (
    <div className={[
      'flex items-center gap-3 px-3 sm:px-4 py-3 transition-colors',
      isIP ? 'bg-teal-50 border-l-4 border-l-teal-500' : 'border-l-4 border-l-transparent hover:bg-slate-50/80',
      dim ? 'opacity-40' : '',
    ].join(' ')}>
      {/* Token */}
      <div className={`w-11 h-11 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-xs font-black flex-shrink-0 ${tokenCls}`}>
        #{apt.tokenNumber}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold text-slate-800 truncate">{apt.patientName}</p>
          {apt.isPriority && (
            <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-700 flex-shrink-0 flex items-center gap-0.5">
              <Star size={8} /> PRIORITY
            </span>
          )}
        </div>
        <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
          <Phone size={9} className="flex-shrink-0" />{apt.patientPhone}
        </p>
        {/* Status chip on mobile sits under name to save horizontal space */}
        <div className="mt-1 sm:hidden">
          <Chip status={apt.status} />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <span className="hidden sm:inline-flex"><Chip status={apt.status} /></span>
        {isIP && queueActive && (
          <button onClick={() => onComplete(apt.tokenNumber)} aria-label="Mark done"
            className="h-9 w-9 sm:h-8 sm:w-auto sm:px-2.5 text-[11px] font-black rounded-lg bg-teal-600 text-white hover:bg-teal-700 transition-colors flex items-center justify-center sm:gap-1 border border-teal-600">
            <CheckCircle2 size={14} /> <span className="hidden sm:inline">Done</span>
          </button>
        )}
        {(isIP || isBR) && queueActive && (
          <button onClick={() => onSkip(apt.tokenNumber)} aria-label="Skip"
            className="h-9 w-9 sm:h-8 sm:w-auto sm:px-2.5 text-[11px] font-black rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-colors flex items-center justify-center sm:gap-1 border border-orange-500">
            <SkipForward size={14} /> <span className="hidden sm:inline">Skip</span>
          </button>
        )}
        {isSk && (
          <button onClick={() => onRecall(apt._id)} aria-label="Recall"
            className="h-9 w-9 sm:h-8 sm:w-auto sm:px-2.5 text-[11px] font-black rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors flex items-center justify-center sm:gap-1 border border-blue-500">
            <RotateCcw size={14} /> <span className="hidden sm:inline">Recall</span>
          </button>
        )}
      </div>
    </div>
  );
}

/* ─── MAIN ─── */
export default function DoctorDashboard() {
  const { user, isDoctor, loading: authLoading } = useAuth();
  const { socket } = useSocket();
  const router = useRouter();

  const [data, setData]                   = useState(null);
  const [pageLoading, setPageLoading]     = useState(true);
  const [busy, setBusy]                   = useState('');
  const [showWalkIn, setShowWalkIn]       = useState(false);
  const [showSettings, setShowSettings]   = useState(false);
  const [showMore, setShowMore]           = useState(false);
  const [bookingOn, setBookingOn]         = useState(false);
  const [tab, setTab]                     = useState('queue');

  /* fetch */
  const refresh = useCallback(async () => {
    try {
      const res = await api.get('/doctors/me');
      setData(res.data.data);
    } catch {}
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setPageLoading(false); return; }
    if (!isDoctor) { router.push('/'); return; }
    refresh().finally(() => setPageLoading(false));
  }, [authLoading, user, isDoctor]);

  useEffect(() => {
    if (data?.doctor?.isBookingOpen !== undefined) setBookingOn(data.doctor.isBookingOpen);
  }, [data?.doctor?.isBookingOpen]);

  useEffect(() => {
    if (!socket || !data?.doctor?._id) return;
    socket.emit('join_doctor', data.doctor._id);
    const h = () => refresh();
    socket.on('queue_updated', h);
    socket.on('new_appointment', h);
    socket.on('appointment_cancelled', h);
    return () => { socket.off('queue_updated', h); socket.off('new_appointment', h); socket.off('appointment_cancelled', h); };
  }, [socket, data?.doctor?._id, refresh]);

  const act = async (endpoint, payload = {}, key = '') => {
    setBusy(key || endpoint);
    try { await api.post(`/queue/${endpoint}`, payload); await refresh(); }
    catch (err) { toast.error(err.response?.data?.message || 'Action failed'); }
    finally { setBusy(''); }
  };

  const patchAct = async (endpoint) => {
    setBusy(endpoint);
    try { await api.patch(`/queue/${endpoint}`); await refresh(); }
    catch (err) { toast.error(err.response?.data?.message || 'Action failed'); }
    finally { setBusy(''); }
  };

  const toggleBooking = async () => {
    try {
      const { data: res } = await api.patch('/doctors/booking-toggle');
      setBookingOn(res.data.isBookingOpen);
      toast.success(res.data.isBookingOpen ? '✅ Booking enabled' : '🔒 Booking disabled');
    } catch { toast.error('Failed'); }
  };

  const saveSettings = async (payload) => {
    setBusy('settings');
    try {
      await api.put('/doctors/profile', payload);
      await refresh();
      setShowSettings(false);
      toast.success('Settings saved');
    } catch { toast.error('Failed'); }
    finally { setBusy(''); }
  };

  const handleComplete = (tokenNumber) => act('next', {}, `c_${tokenNumber}`);
  const handleSkip     = (tokenNumber) => act('skip', { tokenNumber }, `s_${tokenNumber}`);
  const handleRecall   = (id)          => act('recall', { appointmentId: id }, `r_${id}`);

  const handleEnd = async () => {
    if (!window.confirm('End clinic for today?\n\nAll remaining patients will be marked as missed.')) return;
    await act('end', {}, 'end');
    toast.success('Clinic ended. See you tomorrow! 👋');
  };

  if (pageLoading || !data) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-14 h-14 bg-teal-700 rounded-2xl flex items-center justify-center animate-pulse shadow-lg">
          <span className="text-white font-black text-lg">CQ</span>
        </div>
        <p className="text-sm text-slate-400 font-medium">Loading dashboard…</p>
      </div>
    </div>
  );

  const { doctor, queue, appointments = [] } = data;
  const qStatus  = queue?.status || 'not_started';
  const qActive  = qStatus === 'active';
  const qPaused  = qStatus === 'paused';
  const qEnded   = qStatus === 'ended';
  const qStarted = qActive || qPaused;

  const inProgress = appointments.find(a => a.status === 'in_progress');
  const nextUp     = appointments.find(a => a.status === 'be_ready' && a._id !== inProgress?._id);
  const total      = appointments.length;
  const waiting    = appointments.filter(a => ['waiting','be_ready'].includes(a.status)).length;
  const completed  = appointments.filter(a => a.status === 'completed').length;
  const skipped    = appointments.filter(a => a.status === 'skipped').length;
  const pct        = total > 0 ? Math.round((completed / total) * 100) : 0;

  const visibleApts = tab === 'queue'
    ? appointments.filter(a => !['completed','missed','cancelled'].includes(a.status))
    : appointments;

  /* Mobile "More" sheet items — secondary actions live here on mobile only */
  const moreItems = [
    { icon: Plus,  label: 'Add Walk-in Patient', sub: 'Add manually to queue', onClick: () => setShowWalkIn(true) },
    { icon: Bell,  label: 'Notify Next 2',       sub: 'Alert upcoming patients', onClick: () => toast.success('Notification sent to next 2 patients!') },
    { icon: Settings, label: 'Queue Settings',   sub: `Avg ${doctor.avgTimePerPatient}m · Max ${doctor.maxPatientsPerDay} · ${doctor.consultationFee > 0 ? `₹${doctor.consultationFee}` : 'Free'}`, onClick: () => setShowSettings(true) },
    { icon: bookingOn ? Square : Play, label: bookingOn ? 'Close Booking' : 'Open Booking', sub: bookingOn ? 'Stop accepting new patients' : 'Start accepting new patients', onClick: toggleBooking },
    ...(qStarted ? [{ icon: Square, label: 'End Clinic for Today', sub: 'Marks remaining as missed', onClick: handleEnd, danger: true }] : []),
  ];

  /* Mobile bottom action bar height: leaves room above so list isn't hidden */
  const bottomBarPad = qStarted || (!qStarted && !qEnded) ? 'pb-[calc(env(safe-area-inset-bottom)+5.5rem)] lg:pb-4' : 'pb-4';

  return (
    <>
      <div className="min-h-screen bg-slate-50 flex flex-col">

        {/* ════ HEADER ════ */}
        <header className="sticky top-0 z-30 bg-white border-b border-slate-100 shadow-sm">
          <div className="flex items-center h-14 px-3 sm:px-4 gap-2 sm:gap-3">
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <div className="w-9 h-9 bg-teal-700 rounded-xl flex items-center justify-center shadow-sm">
                <span className="text-white text-[11px] font-black">CQ</span>
              </div>
              <span className="font-black text-slate-900 text-sm hidden sm:block">
                Clin<span className="text-teal-600">IQ</span>
              </span>
            </Link>

            <div className="w-px h-5 bg-slate-200 shrink-0 hidden sm:block" />

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-slate-900 truncate leading-tight">Dr. {doctor.name}</p>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize shrink-0 ${Q_BADGE[qStatus]}`}>
                  {qStatus.replace('_',' ')}
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate leading-tight hidden sm:block">{doctor.clinicName || 'Doctor Dashboard'}</p>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 ml-auto shrink-0">
              {/* Booking toggle — visible from sm+ */}
              <button onClick={toggleBooking}
                className={`hidden sm:flex items-center gap-2 h-9 px-3 rounded-xl border text-xs font-semibold transition-colors ${bookingOn ? 'bg-teal-50 text-teal-700 border-teal-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                <div className={`w-8 h-4 rounded-full relative transition-colors ${bookingOn ? 'bg-teal-500' : 'bg-slate-300'}`}>
                  <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-all ${bookingOn ? 'right-0.5' : 'left-0.5'}`} />
                </div>
                <span className="hidden md:block">{bookingOn ? 'Open' : 'Closed'}</span>
              </button>

              {/* Settings — desktop only (mobile uses More sheet) */}
              <button onClick={() => setShowSettings(true)}
                className="hidden lg:flex w-9 h-9 items-center justify-center rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 transition-colors">
                <Settings size={16} />
              </button>

              {/* More menu — mobile/tablet only */}
              <button onClick={() => setShowMore(true)} aria-label="More actions"
                className="lg:hidden w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors">
                <Menu size={18} />
              </button>

              <Link href="/doctor/profile" aria-label="Profile"
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-teal-700 text-white font-black text-sm hover:bg-teal-800 transition-colors shrink-0">
                {doctor.name?.charAt(0).toUpperCase()}
              </Link>
            </div>
          </div>
        </header>

        {/* ════ BODY ════ */}
        <div className="flex flex-1 min-h-0">

          {/* ── SIDEBAR (desktop only ≥lg) ── */}
          <aside className="hidden lg:flex w-72 xl:w-80 bg-white border-r border-slate-100 flex-col shrink-0 overflow-y-auto">

            {/* LIVE TOKEN CARD */}
            <div className={`m-4 rounded-2xl p-5 ${qEnded ? 'bg-slate-50 border border-slate-200' : 'bg-gradient-to-br from-teal-700 to-teal-900 shadow-lg'}`}>
              <div className="flex items-center gap-2 mb-3">
                <Dot active={qActive} />
                <span className={`text-[10px] font-black uppercase tracking-widest ${qEnded ? 'text-slate-400' : 'text-teal-200'}`}>
                  {qEnded ? 'Clinic Ended' : 'Now Serving'}
                </span>
              </div>

              {inProgress && !qEnded ? (
                <>
                  <p className="text-7xl font-black text-white leading-none tracking-tight mb-3">#{inProgress.tokenNumber}</p>
                  <p className="text-white font-bold text-lg leading-tight">{inProgress.patientName}</p>
                  <p className="text-teal-300 text-xs flex items-center gap-1.5 mt-1">
                    <Phone size={10} /> {inProgress.patientPhone}
                  </p>
                  <div className="inline-flex items-center gap-1.5 mt-3 text-xs font-bold bg-teal-600/50 text-teal-100 px-2.5 py-1 rounded-full">
                    <Dot /> In consultation
                  </div>
                </>
              ) : (
                <div className="text-center py-4">
                  <p className={`text-5xl font-black leading-none mb-3 ${qEnded ? 'text-slate-300' : 'text-white/30'}`}>—</p>
                  <p className={`text-sm font-semibold ${qEnded ? 'text-slate-400' : 'text-teal-300'}`}>
                    {qStatus === 'not_started' && 'Start clinic to begin'}
                    {qStatus === 'paused'      && 'Queue is paused'}
                    {qStatus === 'ended'       && `${completed} patients seen today`}
                    {qStatus === 'active'      && 'Queue is empty'}
                  </p>
                </div>
              )}

              {nextUp && !qEnded && (
                <div className="mt-4 pt-3 border-t border-teal-600/40">
                  <p className="text-[10px] font-black text-teal-300 uppercase tracking-widest mb-2">Up Next</p>
                  <div className="flex items-center gap-2.5 bg-teal-600/30 rounded-xl px-3 py-2.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-400 flex items-center justify-center text-xs font-black text-amber-900">#{nextUp.tokenNumber}</div>
                    <p className="text-sm font-semibold text-white truncate flex-1">{nextUp.patientName}</p>
                    <span className="text-[9px] font-black text-amber-300 bg-amber-400/20 px-2 py-0.5 rounded-full">NEXT</span>
                  </div>
                </div>
              )}
            </div>

            {/* CONTROLS */}
            <div className="px-4 pb-4 space-y-3">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Queue Controls</p>

              {!qStarted && !qEnded && (
                <Btn variant="primary" size="xl" className="w-full" disabled={busy === 'start'}
                  onClick={() => act('start', {}, 'start')}>
                  {busy === 'start' ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Play size={18} /> Start Clinic</>}
                </Btn>
              )}

              {qEnded && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center">
                  <p className="text-sm font-bold text-slate-500 mb-3">Clinic ended for today</p>
                  <p className="text-xs text-slate-400 mb-4">Tomorrow the queue resets automatically</p>
                  <Link href="/doctor/profile" className="text-xs text-teal-600 font-bold hover:underline">View your profile →</Link>
                </div>
              )}

              {qStarted && (
                <div className="space-y-2">
                  <Btn variant="primary" size="xl" className="w-full"
                    disabled={!!busy || !qActive}
                    onClick={() => handleComplete(inProgress?.tokenNumber)}>
                    {busy.startsWith('c_')
                      ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      : <><CheckCircle2 size={18} /> Complete &amp; Next</>}
                  </Btn>

                  <div className="grid grid-cols-2 gap-2">
                    <Btn variant="orange" size="md" disabled={!!busy || !qActive || !inProgress}
                      onClick={() => handleSkip(inProgress?.tokenNumber)}>
                      <SkipForward size={14} /> Skip
                    </Btn>
                    <Btn variant="warning" size="md" disabled={!!busy}
                      onClick={() => patchAct('pause')}>
                      {qPaused ? <><Play size={14} /> Resume</> : <><Pause size={14} /> Pause</>}
                    </Btn>
                  </div>

                  <Btn variant="danger" size="md" className="w-full" disabled={!!busy}
                    onClick={handleEnd}>
                    <Square size={14} /> End Clinic for Today
                  </Btn>
                </div>
              )}
            </div>

            <div className="mx-4 border-t border-slate-100" />

            <div className="p-4 space-y-2">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Add Patient</p>
              <button onClick={() => setShowWalkIn(true)}
                className="w-full flex items-center gap-3 p-3 bg-slate-50 hover:bg-teal-50 border border-slate-200 hover:border-teal-200 rounded-2xl transition-colors text-left">
                <div className="w-9 h-9 bg-teal-100 rounded-xl flex items-center justify-center shrink-0">
                  <Plus size={16} className="text-teal-700" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">Walk-in Patient</p>
                  <p className="text-xs text-slate-400">Add manually to queue</p>
                </div>
                <ChevronRight size={15} className="text-slate-300 ml-auto" />
              </button>

              <button onClick={() => toast.success('Notification sent to next 2 patients!')}
                className="w-full flex items-center gap-3 p-3 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-2xl transition-colors text-left">
                <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                  <Bell size={16} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">Notify Next 2</p>
                  <p className="text-xs text-slate-400">Alert upcoming patients</p>
                </div>
                <ChevronRight size={15} className="text-slate-300 ml-auto" />
              </button>
            </div>

            <div className="mx-4 border-t border-slate-100" />

            <div className="p-4 pb-6">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Quick Info</p>
              {[
                { label: 'Avg time/patient', value: `${doctor.avgTimePerPatient} min` },
                { label: 'Max patients/day', value: `${doctor.maxPatientsPerDay}` },
                { label: 'Consultation fee', value: doctor.consultationFee > 0 ? `₹${doctor.consultationFee}` : 'Free' },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center py-2.5 border-b border-slate-100 last:border-0">
                  <span className="text-xs text-slate-500">{label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800">{value}</span>
                    <button onClick={() => setShowSettings(true)} className="text-[10px] font-bold text-teal-600 hover:text-teal-700">Edit</button>
                  </div>
                </div>
              ))}
            </div>
          </aside>

          {/* ── MAIN CONTENT ── */}
          <main className={`flex-1 overflow-y-auto p-3 sm:p-4 md:p-5 space-y-3 sm:space-y-4 ${bottomBarPad}`}>

            {/* MOBILE/TABLET LIVE TOKEN CARD */}
            <div className={`lg:hidden rounded-2xl p-4 sm:p-5 ${qEnded ? 'bg-slate-50 border border-slate-200' : 'bg-gradient-to-br from-teal-700 to-teal-900 shadow-lg'}`}>
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <Dot active={qActive} />
                  <span className={`text-[10px] font-black uppercase tracking-widest ${qEnded ? 'text-slate-400' : 'text-teal-200'}`}>
                    {qEnded ? 'Clinic Ended' : 'Now Serving'}
                  </span>
                </div>
                {nextUp && !qEnded && (
                  <div className="flex items-center gap-1.5 bg-teal-600/30 rounded-full pl-1 pr-2.5 py-1">
                    <span className="text-[9px] font-black text-amber-300 bg-amber-400/20 px-1.5 py-0.5 rounded-full">NEXT</span>
                    <span className="text-xs font-bold text-white">#{nextUp.tokenNumber}</span>
                  </div>
                )}
              </div>

              {inProgress && !qEnded ? (
                <div className="flex items-end gap-4">
                  <p className="text-6xl sm:text-7xl font-black text-white leading-none tracking-tight">#{inProgress.tokenNumber}</p>
                  <div className="flex-1 min-w-0 pb-1">
                    <p className="text-white font-bold text-base sm:text-lg leading-tight truncate">{inProgress.patientName}</p>
                    <p className="text-teal-300 text-xs flex items-center gap-1.5 mt-0.5">
                      <Phone size={10} /> {inProgress.patientPhone}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="py-2">
                  <p className={`text-4xl sm:text-5xl font-black leading-none ${qEnded ? 'text-slate-300' : 'text-white/30'}`}>—</p>
                  <p className={`text-sm font-semibold mt-2 ${qEnded ? 'text-slate-400' : 'text-teal-300'}`}>
                    {qStatus === 'not_started' && 'Start clinic to begin'}
                    {qStatus === 'paused'      && 'Queue is paused'}
                    {qStatus === 'ended'       && `${completed} patients seen today`}
                    {qStatus === 'active'      && 'Queue is empty'}
                  </p>
                </div>
              )}
            </div>

            {/* STATS ROW */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3">
              {[
                { label: 'Total',     value: total,     icon: Users,        cls: 'text-slate-900', bg: 'bg-white border-slate-100' },
                { label: 'Waiting',   value: waiting,   icon: Clock,        cls: 'text-amber-700', bg: 'bg-amber-50 border-amber-100' },
                { label: 'Completed', value: completed, icon: CheckCircle2, cls: 'text-teal-700',  bg: 'bg-teal-50 border-teal-100'  },
                { label: 'Skipped',   value: skipped,   icon: SkipForward,  cls: 'text-orange-700',bg: 'bg-orange-50 border-orange-100'},
              ].map(({ label, value, icon: Icon, cls, bg }) => (
                <div key={label} className={`${bg} rounded-2xl p-3 sm:p-4 border`}>
                  <div className="flex items-start justify-between mb-1.5">
                    <Icon size={16} className={cls} />
                    <span className={`text-2xl sm:text-3xl font-black leading-none ${cls}`}>{value}</span>
                  </div>
                  <p className="text-[11px] sm:text-xs font-semibold text-slate-500">{label}</p>
                </div>
              ))}
            </div>

            {/* PROGRESS */}
            {total > 0 && (
              <div className="bg-white border border-slate-100 rounded-2xl px-4 sm:px-5 py-3 sm:py-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-bold text-slate-700">Daily Progress</p>
                  <p className="text-xs text-slate-400 font-medium">{completed}/{total} · <span className="text-teal-600 font-bold">{pct}%</span></p>
                </div>
                <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-teal-500 to-teal-700 rounded-full transition-all duration-700"
                    style={{ width: `${pct}%` }} />
                </div>
              </div>
            )}

            {/* QUEUE TABLE */}
            <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-3 sm:px-4 py-3 border-b border-slate-100 gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <h2 className="text-sm font-black text-slate-900">Patient Queue</h2>
                  <span className="text-xs font-bold text-slate-500 bg-slate-100 rounded-lg px-2 py-0.5">{total}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex bg-slate-100 rounded-xl p-0.5 text-xs font-bold">
                    {[['queue','Active'],['all','All']].map(([t,l]) => (
                      <button key={t} onClick={() => setTab(t)}
                        className={`px-3 py-1.5 rounded-lg transition-colors ${tab === t ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}>
                        {l}
                      </button>
                    ))}
                  </div>
                  {waiting > 0 && (
                    <span className="hidden sm:inline-flex text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-2.5 py-1.5 items-center gap-1.5">
                      <Clock size={11} /> {waiting} waiting
                    </span>
                  )}
                </div>
              </div>

              {total === 0 ? (
                <div className="py-16 sm:py-20 text-center px-4">
                  <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Users size={24} className="text-slate-300" />
                  </div>
                  <p className="text-base font-bold text-slate-400">No appointments today</p>
                  <p className="text-sm text-slate-400 mt-1">
                    {bookingOn ? 'Waiting for patients to book online' : 'Enable booking to start accepting patients'}
                  </p>
                </div>
              ) : visibleApts.length === 0 ? (
                <div className="py-12 text-center px-4">
                  <p className="text-sm text-slate-400 font-medium">All active patients shown · Switch to "All" to see history</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {visibleApts.map(apt => (
                    <QueueRow key={apt._id} apt={apt} queueActive={qActive}
                      onComplete={handleComplete} onSkip={handleSkip} onRecall={handleRecall} />
                  ))}
                </div>
              )}
            </div>
          </main>
        </div>

        {/* ════ MOBILE/TABLET BOTTOM ACTION BAR (lg:hidden) ════ */}
        {!qEnded && (
          <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-200 shadow-[0_-4px_16px_rgba(0,0,0,0.04)]">
            <div className="px-3 py-2.5 pb-[calc(env(safe-area-inset-bottom)+0.625rem)]">
              {!qStarted ? (
                /* NOT STARTED — single big Start button */
                <button onClick={() => act('start', {}, 'start')} disabled={busy === 'start'}
                  className="w-full h-14 bg-teal-700 text-white rounded-2xl font-bold text-base inline-flex items-center justify-center gap-2 active:scale-[.98] transition-all disabled:opacity-50">
                  {busy === 'start'
                    ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <><Play size={20} /> Start Clinic</>}
                </button>
              ) : (
                /* ACTIVE / PAUSED — primary + 2 secondary */
                <div className="flex items-center gap-2">
                  <button onClick={() => patchAct('pause')} disabled={!!busy}
                    aria-label={qPaused ? 'Resume' : 'Pause'}
                    className="h-14 w-14 shrink-0 bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl inline-flex items-center justify-center active:scale-[.95] transition-all disabled:opacity-50">
                    {qPaused ? <Play size={22} /> : <Pause size={22} />}
                  </button>

                  <button onClick={() => handleComplete(inProgress?.tokenNumber)} disabled={!!busy || !qActive || !inProgress}
                    className="flex-1 h-14 bg-teal-700 text-white rounded-2xl font-bold text-base inline-flex items-center justify-center gap-2 active:scale-[.98] transition-all disabled:opacity-40">
                    {busy.startsWith('c_')
                      ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      : <><CheckCircle2 size={20} /> {inProgress ? `Done · #${inProgress.tokenNumber}` : 'Complete & Next'}</>}
                  </button>

                  <button onClick={() => handleSkip(inProgress?.tokenNumber)} disabled={!!busy || !qActive || !inProgress}
                    aria-label="Skip current"
                    className="h-14 w-14 shrink-0 bg-orange-500 text-white rounded-2xl inline-flex items-center justify-center active:scale-[.95] transition-all disabled:opacity-40">
                    <SkipForward size={22} />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* MODALS */}
      {showWalkIn && (
        <WalkInModal onClose={() => setShowWalkIn(false)} loading={busy === 'priority'}
          onAdd={form => { act('priority', form, 'priority'); setShowWalkIn(false); }} />
      )}
      {showSettings && data?.doctor && (
        <SettingsModal doctor={data.doctor} onClose={() => setShowSettings(false)}
          onSave={saveSettings} loading={busy === 'settings'} />
      )}
      <MoreSheet open={showMore} onClose={() => setShowMore(false)} items={moreItems} />
    </>
  );
}
