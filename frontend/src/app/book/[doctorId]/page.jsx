'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  User, Phone, FileText, CheckCircle2,
  AlertCircle, MapPin, ChevronRight, MessageCircle, RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext.jsx';
import { useSocket } from '../../../context/SocketContext.jsx';
import api from '../../../lib/api.js';
import toast from 'react-hot-toast';
import AuthModal from '../../../components/common/AuthModal.jsx';

export default function BookPage() {
  const { doctorId } = useParams();
  const { user, isLoggedIn } = useAuth();
  const { socket } = useSocket();

  const [doctor,    setDoctor]   = useState(null);
  const [loading,   setLoading]  = useState(true);
  const [booking,   setBooking]  = useState(false);
  const [booked,    setBooked]   = useState(null);
  const [showAuth,  setShowAuth] = useState(false);
  const [refreshing,setRefreshing]= useState(false);
  const [form, setForm] = useState({ patientName: '', patientPhone: '', notes: '' });

  // Fetch doctor with live queue data
  const fetchDoctor = useCallback(async (showSpinner = false) => {
    if (showSpinner) setRefreshing(true);
    try {
      const { data } = await api.get(`/doctors/${doctorId}`);
      setDoctor(data.data);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, [doctorId]);

  useEffect(() => { fetchDoctor(false); }, [fetchDoctor]);

  // Auto-fill user details
  useEffect(() => {
    if (user) setForm(f => ({ ...f, patientName: user.name || '', patientPhone: user.phone || '' }));
  }, [user]);

  // Socket — join public queue room for live updates
  useEffect(() => {
    if (!socket || !doctorId) return;
    socket.emit('join_queue', doctorId);
    const onUpdate = () => fetchDoctor(false);
    socket.on('queue_updated',           onUpdate);
    socket.on('booking_status_changed',  onUpdate);
    socket.on('new_appointment',         onUpdate);
    return () => {
      socket.off('queue_updated',          onUpdate);
      socket.off('booking_status_changed', onUpdate);
      socket.off('new_appointment',        onUpdate);
      socket.emit('leave_queue', doctorId);
    };
  }, [socket, doctorId, fetchDoctor]);

  // Auto-refresh every 30 s as fallback
  useEffect(() => {
    const t = setInterval(() => fetchDoctor(false), 30_000);
    return () => clearInterval(t);
  }, [fetchDoctor]);

  const handleBook = async (e) => {
    e.preventDefault();
    if (!isLoggedIn) { setShowAuth(true); return; }
    if (!form.patientName.trim() || !form.patientPhone.trim()) { toast.error('Name and phone are required'); return; }
    if (form.patientPhone.length !== 10) { toast.error('Enter a valid 10-digit phone number'); return; }

    setBooking(true);
    try {
      const { data } = await api.post('/appointments/book', { doctorId, ...form });
      setBooked(data.data);
      toast.success('🎉 Appointment booked!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Booking failed. Please try again.');
    } finally { setBooking(false); }
  };

  const sendWhatsApp = () => {
    if (!booked) return;
    const { appointment } = booked;
    const msg = `Hi! My token number is *#${appointment.tokenNumber}* at ${doctor?.name}'s clinic.\nTrack my queue live: ${window.location.origin}/queue/${appointment._id}`;
    window.open(`https://wa.me/91${form.patientPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  /* ── Loading ── */
  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
    </div>
  );

  if (!doctor) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 text-center">
      <div>
        <AlertCircle size={48} className="text-slate-300 mx-auto mb-4" />
        <h2 className="font-black text-slate-700 text-xl mb-4">Doctor not found</h2>
        <Link href="/search" className="btn-primary inline-flex">Search Doctors</Link>
      </div>
    </div>
  );

  /* ── SUCCESS SCREEN ── */
  if (booked) {
    const { appointment, queueInfo } = booked;
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm">
          <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden">
            <div className="bg-teal-700 px-6 py-5 text-center">
              <CheckCircle2 size={40} className="text-teal-200 mx-auto mb-2" />
              <h2 className="text-xl font-black text-white">You're Booked!</h2>
              <p className="text-teal-200 text-sm mt-1">{doctor.name} · {doctor.specialization}</p>
            </div>

            <div className="p-6 text-center border-b border-slate-100">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Your Token Number</p>
              <p className="text-8xl font-black text-teal-700 leading-none">#{appointment.tokenNumber}</p>
              <p className="text-sm text-slate-500 mt-2">{doctor.clinicName || doctor.name}</p>
            </div>

            <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100">
              {[
                { label: 'Serving', value: `#${queueInfo.currentToken}`            },
                { label: 'Ahead',   value: queueInfo.patientsAhead                  },
                { label: 'Wait',    value: `~${queueInfo.estimatedWaitMinutes}m`    },
              ].map(({ label, value }) => (
                <div key={label} className="p-4 text-center">
                  <p className="text-lg font-black text-slate-900">{value}</p>
                  <p className="text-xs text-slate-400 font-semibold">{label}</p>
                </div>
              ))}
            </div>

            <div className="px-5 py-3 bg-amber-50 border-b border-amber-100 flex items-center gap-2">
              <span className="text-amber-500 font-black text-sm">₹</span>
              <p className="text-xs font-semibold text-amber-700">
                Pay at clinic · {doctor.consultationFee > 0 ? `₹${doctor.consultationFee}` : 'Fee as per doctor'}
              </p>
            </div>

            <div className="p-5 space-y-2">
              <Link href={`/queue/${appointment._id}`}
                className="w-full h-12 bg-teal-700 text-white font-black rounded-2xl flex items-center justify-center gap-2 hover:bg-teal-800 transition-colors">
                Track Live Queue <ChevronRight size={18} />
              </Link>
              <button onClick={sendWhatsApp}
                className="w-full h-11 bg-green-500 text-white font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-green-600 transition-colors text-sm">
                <MessageCircle size={16} /> Send to WhatsApp
              </button>
              <Link href="/profile"
                className="w-full h-10 bg-slate-100 text-slate-700 font-semibold rounded-2xl flex items-center justify-center text-sm hover:bg-slate-200 transition-colors">
                View All Appointments
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── BOOKING FORM — read the correct fields ── */
  const { queue } = doctor;

  // waitingCount / estimatedWait are computed by the backend; derive locally as fallback
  const waitingCount = doctor.waitingCount ?? (queue ? Math.max(0, (queue.lastTokenIssued || 0) - (queue.currentToken || 0)) : 0);
  const estimatedWait = doctor.estimatedWait ?? (waitingCount * (doctor.avgTimePerPatient || 15));

  const qActive = queue?.status === 'active';

  return (
    <>
      <div className="min-h-screen bg-slate-50 pb-10">

        {/* Header */}
        <div className="bg-teal-700 text-white px-4 pt-10 pb-8">
          <div className="max-w-lg mx-auto">
            <p className="text-teal-300 text-sm font-semibold mb-1">Booking appointment with</p>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-white font-black text-2xl flex-shrink-0 overflow-hidden">
                {doctor.avatar
                  ? <img src={doctor.avatar} alt={doctor.name} className="w-full h-full object-cover" />
                  : doctor.name?.charAt(0)}
              </div>
              <div>
                <h1 className="text-xl font-black">{doctor.name}</h1>
                <p className="text-teal-200 text-sm">{doctor.specialization}</p>
                {doctor.clinicName && (
                  <p className="text-teal-300 text-xs flex items-center gap-1 mt-0.5">
                    <MapPin size={10} />{doctor.clinicName}
                  </p>
                )}
              </div>
            </div>

            {/* Live queue banner — uses correct fields from API */}
            {qActive && (
              <div className="mt-4 bg-white/15 rounded-2xl px-4 py-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-sm font-bold text-white">Clinic Active</span>
                  </div>
                  <button onClick={() => fetchDoctor(true)} disabled={refreshing}
                    className="text-teal-200 hover:text-white transition-colors disabled:opacity-40">
                    <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  {[
                    { label: 'Serving',  value: `#${queue.currentToken}`                                     },
                    { label: 'Waiting',  value: waitingCount                                                  },
                    { label: 'Est. Wait',value: estimatedWait > 0 ? `~${estimatedWait}m` : '< 15m'           },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-white/10 rounded-xl p-2">
                      <p className="text-base font-black text-white leading-tight">{value}</p>
                      <p className="text-[10px] text-teal-200 font-semibold mt-0.5">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {queue?.status === 'not_started' && (
              <div className="mt-4 bg-white/10 rounded-2xl px-4 py-3 text-sm text-teal-200 font-medium text-center">
                Clinic hasn't started yet · Queue will open soon
              </div>
            )}
            {queue?.status === 'paused' && (
              <div className="mt-4 bg-white/10 rounded-2xl px-4 py-3 text-sm text-amber-200 font-medium text-center">
                Queue is temporarily paused by the doctor
              </div>
            )}
          </div>
        </div>

        {/* Form */}
        <div className="max-w-lg mx-auto px-4 -mt-4">
          {!doctor.isBookingOpen && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-4 flex items-center gap-3">
              <AlertCircle size={18} className="text-red-500 flex-shrink-0" />
              <p className="text-sm font-semibold text-red-700">Booking is currently closed by the doctor.</p>
            </div>
          )}

          <form onSubmit={handleBook} className="bg-white rounded-3xl border border-slate-100 p-5 space-y-4">
            <h2 className="font-black text-slate-900 text-lg">Confirm Your Appointment</h2>

            <div>
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5 block">
                Patient Name *
              </label>
              <div className="relative">
                <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" placeholder="Full name" value={form.patientName}
                  onChange={e => setForm(f => ({ ...f, patientName: e.target.value }))}
                  className="w-full h-12 pl-10 pr-4 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-400 transition-all"
                  required />
              </div>
            </div>

            <div>
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5 block">
                Phone Number *
              </label>
              <div className="relative">
                <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="tel" placeholder="10-digit mobile" maxLength={10} value={form.patientPhone}
                  onChange={e => setForm(f => ({ ...f, patientPhone: e.target.value.replace(/\D/g, '') }))}
                  className="w-full h-12 pl-10 pr-4 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-400 transition-all"
                  required />
              </div>
              <p className="text-xs text-slate-400 mt-1">Doctor will contact you on this number</p>
            </div>

            <div>
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5 block">
                Reason / Notes (optional)
              </label>
              <div className="relative">
                <FileText size={15} className="absolute left-3.5 top-3.5 text-slate-400" />
                <textarea placeholder="Brief description of your symptoms…" value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={3}
                  className="w-full pl-10 pr-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-400 transition-all resize-none" />
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-amber-700 font-black text-base">₹</span>
              </div>
              <div>
                <p className="text-sm font-bold text-amber-800">Pay at Clinic</p>
                <p className="text-xs text-amber-600">
                  Consultation fee: {doctor.consultationFee > 0 ? `₹${doctor.consultationFee}` : 'As per doctor'}
                </p>
              </div>
            </div>

            {!isLoggedIn && (
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3 text-center">
                <p className="text-xs font-semibold text-blue-700">
                  You'll be asked to sign in to confirm your booking
                </p>
              </div>
            )}

            <button type="submit" disabled={booking || !doctor.isBookingOpen}
              className="w-full h-14 bg-teal-700 text-white font-black rounded-2xl hover:bg-teal-800 transition-colors flex items-center justify-center gap-2 text-base shadow-lg shadow-teal-200/50 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[.98]">
              {booking
                ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : doctor.isBookingOpen ? 'Confirm Appointment →' : 'Booking Closed'}
            </button>

            <p className="text-xs text-slate-400 text-center">Free cancellation anytime before your turn</p>
          </form>

          {/* Quick info footer */}
          <div className="mt-4 bg-white rounded-2xl border border-slate-100 p-4 grid grid-cols-3 divide-x divide-slate-100 text-center">
            {[
              { label: 'Experience', value: doctor.experience > 0 ? `${doctor.experience}y` : 'N/A' },
              { label: 'Avg Time',   value: `${doctor.avgTimePerPatient}m` },
              { label: 'Max/Day',    value: doctor.maxPatientsPerDay },
            ].map(({ label, value }) => (
              <div key={label} className="px-2">
                <p className="text-sm font-black text-slate-900">{value}</p>
                <p className="text-xs text-slate-400">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} onSuccess={() => setShowAuth(false)} />}
    </>
  );
}