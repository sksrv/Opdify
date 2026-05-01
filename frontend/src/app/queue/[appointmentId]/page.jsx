'use client';
import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Clock, CheckCircle2, AlertCircle, Bell,
  RefreshCw, ArrowLeft, Phone, MapPin, Share2,
} from 'lucide-react';
import { useSocket } from '../../../context/SocketContext.jsx';
import api from '../../../lib/api.js';

const STATUS_CFG = {
  waiting:     { label:'Waiting',     color:'text-slate-700',  bg:'bg-slate-50',  border:'border-slate-200', Icon: Clock },
  be_ready:    { label:'Be Ready!',   color:'text-amber-700',  bg:'bg-amber-50',  border:'border-amber-300', Icon: Bell },
  in_progress: { label:'Your Turn!',  color:'text-teal-700',   bg:'bg-teal-50',   border:'border-teal-400',  Icon: CheckCircle2 },
  completed:   { label:'Completed',   color:'text-green-700',  bg:'bg-green-50',  border:'border-green-200', Icon: CheckCircle2 },
  skipped:     { label:'Skipped',     color:'text-orange-700', bg:'bg-orange-50', border:'border-orange-200',Icon: AlertCircle },
  missed:      { label:'Missed',      color:'text-red-700',    bg:'bg-red-50',    border:'border-red-200',   Icon: AlertCircle },
  cancelled:   { label:'Cancelled',   color:'text-red-700',    bg:'bg-red-50',    border:'border-red-200',   Icon: AlertCircle },
};

function Dot() {
  return <span className="inline-block w-2 h-2 rounded-full bg-teal-500 animate-pulse flex-shrink-0" />;
}

export default function QueuePage() {
  const { appointmentId } = useParams();
  const { socket, connected } = useSocket();
  const [data, setData]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [updatedAt, setUpdatedAt] = useState(null);

  const refresh = useCallback(async () => {
    try {
      const res = await api.get(`/appointments/${appointmentId}/status`);
      setData(res.data.data);
      setUpdatedAt(new Date());
    } catch {} finally { setLoading(false); }
  }, [appointmentId]);

  useEffect(() => { refresh(); }, [refresh]);

  useEffect(() => {
    if (!socket || !data?.appointment?.doctorId) return;
    const dId = typeof data.appointment.doctorId === 'object'
      ? data.appointment.doctorId._id
      : data.appointment.doctorId;
    socket.emit('join_queue', dId);
    const fn = () => refresh();
    ['queue_updated','your_turn','be_ready','appointment_skipped'].forEach(ev => socket.on(ev, fn));
    return () => {
      ['queue_updated','your_turn','be_ready','appointment_skipped'].forEach(ev => socket.off(ev, fn));
      socket.emit('leave_queue', dId);
    };
  }, [socket, data?.appointment?.doctorId, refresh]);

  useEffect(() => {
    const t = setInterval(refresh, 30000);
    return () => clearInterval(t);
  }, [refresh]);

  const shareLink = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: 'My Queue Token', url });
    } else {
      navigator.clipboard.writeText(url);
      alert('Link copied!');
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
    </div>
  );

  if (!data) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 text-center">
      <div>
        <AlertCircle size={48} className="text-slate-300 mx-auto mb-4" />
        <h2 className="font-black text-slate-700 text-xl mb-2">Appointment not found</h2>
        <Link href="/profile" className="btn-primary mt-4 inline-flex">Back to Profile</Link>
      </div>
    </div>
  );

  const { appointment, queue, liveInfo } = data;
  const doctor    = appointment.doctorId;
  const status    = liveInfo.displayStatus || appointment.status;
  const cfg       = STATUS_CFG[status] || STATUS_CFG.waiting;
  const { Icon }  = cfg;
  const isYourTurn= status === 'in_progress';
  const isBeReady = status === 'be_ready';
  const isActive  = ['waiting','be_ready','in_progress'].includes(status);

  return (
    <div className="min-h-screen bg-slate-50 pb-10">
      {/* Top bar */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/profile" className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800">
            <ArrowLeft size={16} /> Back
          </Link>
          <div className="flex items-center gap-2">
            {connected
              ? <span className="flex items-center gap-1.5 text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full"><Dot /> Live</span>
              : <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">Offline</span>}
            <button onClick={shareLink} className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors">
              <Share2 size={15} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 pt-5 space-y-4">

        {/* Doctor card */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-400 to-teal-700 flex items-center justify-center text-white font-black text-xl flex-shrink-0">
            {doctor?.name?.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-slate-900 truncate">{doctor?.name}</p>
            <p className="text-teal-600 text-sm font-semibold">{doctor?.specialization}</p>
            {doctor?.clinicName && (
              <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5 truncate">
                <MapPin size={9} />{doctor.clinicName}
              </p>
            )}
          </div>
        </div>

        {/* STATUS / TOKEN CARD */}
        <div className={`rounded-3xl p-8 text-center border-2 ${cfg.border} ${cfg.bg} relative overflow-hidden`}>
          {/* Pulse ring for "your turn" */}
          {isYourTurn && (
            <div className="absolute inset-0 rounded-3xl animate-ping border-4 border-teal-400 opacity-20 pointer-events-none" />
          )}

          {isYourTurn && (
            <div className="flex items-center justify-center gap-2 mb-4">
              <Dot />
              <p className="text-teal-700 text-sm font-black uppercase tracking-widest">It's Your Turn!</p>
            </div>
          )}
          {isBeReady && (
            <div className="flex items-center justify-center gap-2 mb-4">
              <Bell size={16} className="text-amber-500 animate-bounce" />
              <p className="text-amber-700 text-sm font-black uppercase tracking-widest">Get Ready Now!</p>
            </div>
          )}

          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Your Token</p>
          <p className={`text-[96px] font-black leading-none mb-4 ${cfg.color}`}>
            #{appointment.tokenNumber}
          </p>

          <span className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-black ${cfg.bg} ${cfg.color} border-2 ${cfg.border}`}>
            <Icon size={15} /> {cfg.label}
          </span>
        </div>

        {/* LIVE STATS */}
        {isActive && (
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Serving', value: `#${liveInfo.currentToken}` },
              { label: 'Ahead',   value: liveInfo.patientsAhead },
              { label: 'Wait',    value: liveInfo.estimatedWaitMinutes > 0 ? `~${liveInfo.estimatedWaitMinutes}m` : 'Now!', warn: liveInfo.estimatedWaitMinutes > 60 },
            ].map(({ label, value, warn }) => (
              <div key={label} className="bg-white rounded-2xl border border-slate-100 p-4 text-center">
                <p className={`text-2xl font-black leading-none mb-1 ${warn ? 'text-amber-600' : 'text-slate-900'}`}>{value}</p>
                <p className="text-xs text-slate-400 font-semibold">{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* STATUS BANNERS */}
        {liveInfo.queueStatus === 'not_started' && (
          <div className="bg-white rounded-2xl border border-slate-100 p-5 text-center">
            <Clock size={24} className="text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-600">Doctor hasn't started yet</p>
            <p className="text-xs text-slate-400 mt-1">This page updates automatically</p>
          </div>
        )}
        {liveInfo.queueStatus === 'paused' && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center">
            <p className="text-sm font-bold text-amber-700">Queue is temporarily paused by the doctor</p>
          </div>
        )}
        {liveInfo.estimatedWaitMinutes > 60 && isActive && (
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <AlertCircle size={18} className="text-amber-500 flex-shrink-0" />
            <p className="text-sm font-semibold text-amber-700">High waiting time — you can leave and come back closer to your turn.</p>
          </div>
        )}
        {['missed','cancelled','skipped'].includes(status) && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center">
            <p className="text-sm font-bold text-red-700 mb-2">
              {status === 'missed' ? 'Your appointment was missed.' : status === 'cancelled' ? 'Appointment cancelled.' : 'You were skipped.'}
            </p>
            <Link href="/search" className="text-sm font-bold text-teal-600 hover:underline">Book again →</Link>
          </div>
        )}

        {/* PATIENT INFO */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-3 text-sm">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Your Details</p>
          {[
            { label: 'Name',  value: appointment.patientName },
            { label: 'Phone', value: appointment.patientPhone },
            { label: 'Date',  value: appointment.date },
            { label: 'Token', value: `#${appointment.tokenNumber}` },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between items-center border-b border-slate-50 last:border-0 pb-2.5 last:pb-0">
              <span className="text-slate-500 font-medium">{label}</span>
              <span className="font-bold text-slate-900">{value}</span>
            </div>
          ))}
        </div>

        {/* REFRESH */}
        <button onClick={refresh}
          className="w-full h-12 bg-white border border-slate-200 rounded-2xl text-slate-700 font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors">
          <RefreshCw size={15} /> Refresh Status
        </button>

        {updatedAt && (
          <p className="text-xs text-slate-400 text-center">
            Last updated: {updatedAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </p>
        )}
      </div>
    </div>
  );
}
