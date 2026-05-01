'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Calendar, Clock, MapPin, ChevronRight, Hash, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import api from '../../lib/api.js';
import toast from 'react-hot-toast';

const STATUS = {
  waiting:     { label: 'Waiting',     cls: 'bg-slate-100 text-slate-700'   },
  be_ready:    { label: 'Be Ready',    cls: 'bg-amber-100 text-amber-800'   },
  in_progress: { label: 'Your Turn',   cls: 'bg-teal-100 text-teal-800'     },
  completed:   { label: 'Completed',   cls: 'bg-green-100 text-green-700'   },
  skipped:     { label: 'Skipped',     cls: 'bg-orange-100 text-orange-700' },
  missed:      { label: 'Missed',      cls: 'bg-red-100 text-red-700'       },
  cancelled:   { label: 'Cancelled',   cls: 'bg-slate-100 text-slate-500'   },
};

export default function MyAppointmentsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [appointments, setAppointments] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState('all');

  useEffect(() => {
    if (!authLoading && !user) { router.push('/'); return; }
    if (user) {
      api.get('/appointments/my?limit=30')
        .then(({ data }) => setAppointments(data.data || []))
        .finally(() => setLoading(false));
    }
  }, [user, authLoading]);

  const cancel = async (id) => {
    if (!confirm('Cancel this appointment?')) return;
    try {
      await api.patch(`/appointments/${id}/cancel`);
      setAppointments(prev => prev.map(a => a._id === id ? { ...a, status: 'cancelled' } : a));
      toast.success('Appointment cancelled');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const shown = filter === 'all' ? appointments
    : filter === 'active' ? appointments.filter(a => ['waiting','be_ready','in_progress'].includes(a.status))
    : appointments.filter(a => ['completed','missed','cancelled','skipped'].includes(a.status));

  return (
    <div className="min-h-screen bg-slate-50 pb-10">
      {/* Header */}
      <div className="bg-teal-700 text-white px-4 pt-8 pb-6">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-black">My Appointments</h1>
          <p className="text-teal-200 text-sm mt-1">Track and manage all your bookings</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-5 space-y-4">
        {/* Filter tabs */}
        <div className="flex bg-white rounded-2xl border border-slate-100 p-1 gap-1">
          {[['all','All'],['active','Active'],['past','Past']].map(([v,l]) => (
            <button key={v} onClick={() => setFilter(v)}
              className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-colors ${filter===v ? 'bg-teal-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              {l}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">{[...Array(4)].map((_,i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 animate-pulse">
              <div className="flex gap-4"><div className="w-12 h-12 bg-slate-100 rounded-2xl flex-shrink-0" /><div className="flex-1 space-y-2"><div className="h-4 bg-slate-100 rounded w-1/2" /><div className="h-3 bg-slate-100 rounded w-1/3" /></div></div>
            </div>
          ))}</div>
        ) : shown.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
            <Calendar size={40} className="text-slate-200 mx-auto mb-4" />
            <p className="font-bold text-slate-500 text-base">No appointments found</p>
            <p className="text-slate-400 text-sm mt-1">
              {filter === 'active' ? 'No active appointments right now' : 'Book your first appointment'}
            </p>
            <Link href="/search" className="mt-4 inline-flex h-11 px-6 bg-teal-700 text-white font-bold rounded-2xl hover:bg-teal-800 transition-colors items-center gap-2 text-sm">
              Find Doctors
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {shown.map(apt => {
              const doc    = apt.doctorId;
              const cfg    = STATUS[apt.status] || STATUS.waiting;
              const active = ['waiting','be_ready','in_progress'].includes(apt.status);
              return (
                <div key={apt._id} className={`bg-white rounded-2xl border ${active ? 'border-teal-200' : 'border-slate-100'} p-5`}>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-100 to-teal-200 flex items-center justify-center text-teal-700 font-black text-xl flex-shrink-0 overflow-hidden">
                      {doc?.avatar ? <img src={doc.avatar} alt="" className="w-full h-full object-cover" /> : doc?.name?.charAt(0) || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-bold text-slate-900 truncate">{doc?.name || 'Doctor'}</p>
                          <p className="text-teal-600 text-xs font-semibold">{doc?.specialization}</p>
                        </div>
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap flex-shrink-0 ${cfg.cls}`}>{cfg.label}</span>
                      </div>
                      <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-500">
                        <span className="flex items-center gap-1"><Calendar size={10} />{apt.date}</span>
                        <span className="flex items-center gap-1"><Hash size={10} />Token #{apt.tokenNumber}</span>
                        {doc?.clinicName && <span className="flex items-center gap-1 max-w-[150px]"><MapPin size={10} /><span className="truncate">{doc.clinicName}</span></span>}
                      </div>
                    </div>
                  </div>

                  {active && (
                    <div className="flex gap-2 mt-4 pt-3 border-t border-slate-100">
                      <Link href={`/queue/${apt._id}`}
                        className="flex-1 h-10 bg-teal-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 hover:bg-teal-800 transition-colors">
                        <Clock size={13} /> Track Queue
                      </Link>
                      <Link href={`/doctor/${doc?._id}`}
                        className="h-10 px-3 text-xs font-bold text-slate-600 border border-slate-200 rounded-xl flex items-center gap-1.5 hover:bg-slate-50 transition-colors">
                        Profile
                      </Link>
                      <button onClick={() => cancel(apt._id)}
                        className="h-10 px-3 text-xs font-bold text-red-600 border border-red-200 rounded-xl hover:bg-red-50 transition-colors">
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
