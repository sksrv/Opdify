'use client';
import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import {
  Star, Clock, MapPin, BadgeCheck, Users, Copy,
  AlertCircle, Calendar, Phone, ChevronRight, RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../../lib/api.js';
import { useSocket } from '../../../context/SocketContext.jsx';



function LiveDot({ active }) {
  return (
    <span className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${active ? 'bg-teal-500 animate-pulse' : 'bg-slate-300'}`} />
  );
}

export default function DoctorProfileClient({ doctor: initialDoctor }) {
  const { socket } = useSocket();
  // Keep a live-refreshable copy of the doctor+queue data
  const [doctor, setDoctor] = useState(initialDoctor);
  const [refreshing, setRefreshing] = useState(false);

  // Re-fetch fresh queue data from API
  const refreshQueue = useCallback(async () => {
    setRefreshing(true);
    try {
      const { data } = await api.get(`/doctors/${initialDoctor._id}`);
      setDoctor(data.data);
    } catch {}
    finally { setRefreshing(false); }
  }, [initialDoctor._id]);

  // Join the public queue room so socket pushes land here
  useEffect(() => {
    if (!socket || !initialDoctor._id) return;
    socket.emit('join_queue', initialDoctor._id);
    const onUpdate = () => refreshQueue();
    socket.on('queue_updated',       onUpdate);
    socket.on('new_appointment',     onUpdate);
    socket.on('booking_status_changed', onUpdate);
    return () => {
      socket.off('queue_updated',       onUpdate);
      socket.off('new_appointment',     onUpdate);
      socket.off('booking_status_changed', onUpdate);
      socket.emit('leave_queue', initialDoctor._id);
    };
  }, [socket, initialDoctor._id, refreshQueue]);

  // Auto-refresh every 30 s as fallback (socket may be offline)
  useEffect(() => {
    const t = setInterval(refreshQueue, 30_000);
    return () => clearInterval(t);
  }, [refreshQueue]);

  useEffect(() => {
  refreshQueue();
}, [refreshQueue]);

  const { queue } = doctor;
  // Compute from queue fields (backend also sends these after the fix, fallback for older responses)
  const waitingCount = doctor.waitingCount ?? (queue ? Math.max(0, (queue.lastTokenIssued || 0) - (queue.currentToken || 0)) : 0);
  const estimatedWait = doctor.estimatedWait ?? (waitingCount * (doctor.avgTimePerPatient || 15));
  

  const isOpen   = doctor.isBookingOpen;
  const qActive  = queue?.status === 'active' || queue?.status === 'paused';
  const highWait = estimatedWait > 60;

  const copyId = () => {
    navigator.clipboard.writeText(doctor.uniqueId);
    toast.success('Doctor ID copied!');
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">

        {/* HERO CARD */}
        <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden">
          <div className="h-28 bg-gradient-to-br from-teal-600 to-teal-900 relative">
            <div className="absolute inset-0 opacity-10"
              style={{ backgroundImage: 'radial-gradient(circle at 70% 50%, white 0%, transparent 60%)' }} />
          </div>
          <div className="px-5 pb-5">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12 mb-4">
              <div className="relative w-24 h-24">
                <div className="w-24 h-24 rounded-2xl border-4 border-white shadow-lg overflow-hidden bg-gradient-to-br from-teal-400 to-teal-700">
                  {doctor.avatar
                    ? <img src={doctor.avatar} alt={doctor.name} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-white font-black text-4xl">
                        {doctor.name?.charAt(0)}
                      </div>}
                </div>
                {doctor.isVerified && (
                  <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-teal-500 rounded-full flex items-center justify-center ring-2 ring-white">
                    <BadgeCheck size={14} className="text-white" />
                  </div>
                )}
              </div>
              <span className={`self-start sm:self-end text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 ${isOpen ? 'bg-teal-100 text-teal-800' : 'bg-red-100 text-red-700'}`}>
                <LiveDot active={isOpen} />
                {isOpen ? 'Booking Open' : 'Booking Closed'}
              </span>
            </div>

            <h1 className="text-2xl font-black text-slate-900">{doctor.name}</h1>
            <p className="text-teal-600 font-bold">{doctor.specialization}</p>
            {doctor.qualifications?.length > 0 && (
              <p className="text-slate-500 text-sm mt-0.5">{doctor.qualifications.join(' · ')}</p>
            )}

            <div className="flex flex-wrap gap-4 mt-3 text-sm text-slate-600">
              {doctor.rating > 0 && (
                <span className="flex items-center gap-1.5">
                  <Star size={14} className="text-amber-500 fill-amber-500" />
                  <strong>{doctor.rating.toFixed(1)}</strong>
                  <span className="text-slate-400">({doctor.reviewCount})</span>
                </span>
              )}
              {doctor.experience > 0 && (
                <span className="flex items-center gap-1.5">
                  <Clock size={14} className="text-teal-500" />{doctor.experience} yrs
                </span>
              )}
              {doctor.totalPatientsSeen > 0 && (
                <span className="flex items-center gap-1.5">
                  <Users size={14} className="text-teal-500" />{doctor.totalPatientsSeen}+ patients
                </span>
              )}
              {doctor.phone && (
                <span className="flex items-center gap-1.5">
                  <Phone size={14} className="text-teal-500" />{doctor.phone}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 mt-3">
              <span className="text-xs font-bold text-slate-400">Doctor ID:</span>
              <button onClick={copyId}
                className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-1.5">
                {doctor.uniqueId} <Copy size={10} />
              </button>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {/* ── LEFT ── */}
          <div className="md:col-span-2 space-y-5">

            {doctor.bio && (
              <div className="bg-white rounded-3xl border border-slate-100 p-5">
                <h3 className="font-black text-slate-900 mb-3">About Dr. {doctor.name}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{doctor.bio}</p>
              </div>
            )}

            <div className="bg-white rounded-3xl border border-slate-100 p-5">
              <h3 className="font-black text-slate-900 mb-4">Clinic Information</h3>
              <div className="space-y-3">
                {[
                  { Icon: BadgeCheck, label: 'Clinic',   value: doctor.clinicName },
                  { Icon: MapPin,     label: 'Address',  value: [doctor.clinicAddress?.street, doctor.clinicAddress?.city, doctor.clinicAddress?.state, doctor.clinicAddress?.pincode].filter(Boolean).join(', ') },
                  { Icon: Phone,      label: 'Contact',  value: doctor.phone },
                  { Icon: Clock,      label: 'Hours',    value: doctor.workingHours ? `${doctor.workingHours.start} – ${doctor.workingHours.end}` : null },
                ].map(({ Icon, label, value }) => value ? (
                  <div key={label} className="flex items-start gap-3">
                    <div className="w-9 h-9 bg-teal-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Icon size={15} className="text-teal-600" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 font-semibold">{label}</p>
                      <p className="text-sm text-slate-800 font-medium">{value}</p>
                    </div>
                  </div>
                ) : null)}

                {doctor.workingDays?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((d, i) => {
                      const full = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'][i];
                      const on   = doctor.workingDays.includes(full);
                      return (
                        <span key={d} className={`text-xs font-bold px-2.5 py-1 rounded-lg ${on ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 text-slate-300'}`}>
                          {d}
                        </span>
                      );
                    })}
                  </div>
                )}

              </div>

              {/* Map */}
              {doctor.location?.coordinates?.length === 2 && doctor.location.coordinates[0] !== 0 && (
                <div className="mt-4 rounded-2xl overflow-hidden border border-slate-200 h-52">
                  <iframe
                    title="Clinic Location"
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${doctor.location.coordinates[0] - 0.01},${doctor.location.coordinates[1] - 0.01},${doctor.location.coordinates[0] + 0.01},${doctor.location.coordinates[1] + 0.01}&layer=mapnik&marker=${doctor.location.coordinates[1]},${doctor.location.coordinates[0]}`}
                    className="w-full h-full border-0"
                    loading="lazy"
                  />
                </div>
              )}
            </div>
          </div>

          {/* ── RIGHT — Booking sidebar ── */}
          <div className="space-y-4">

            {/* QUEUE STATUS CARD — the one that was broken */}
            <div className="bg-white rounded-3xl border border-slate-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <LiveDot active={qActive} />
                  <h3 className="font-black text-slate-900 text-sm">Today's Queue</h3>
                </div>
                <button onClick={refreshQueue} disabled={refreshing}
                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 transition-colors disabled:opacity-40">
                  <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
                </button>
              </div>

              {qActive ? (
                <div className="space-y-3">
                  {/* Currently serving */}
                  <div className="bg-teal-50 border border-teal-200 rounded-2xl p-3 text-center">
                    <p className="text-4xl font-black text-teal-700 leading-none">
                      {queue.currentToken}
                    </p>
                    <p className="text-xs text-teal-500 font-semibold mt-1">Currently Serving</p>
                  </div>

                  {/* Waiting + Est. wait — NOW CORRECT */}
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="bg-slate-50 rounded-xl p-2.5">
                      <p className="text-lg font-black text-slate-800">{waitingCount}</p>
                      <p className="text-xs text-slate-400">Waiting</p>
                    </div>
                    <div className={`rounded-xl p-2.5 ${highWait ? 'bg-red-50' : 'bg-slate-50'}`}>
                      <p className={`text-lg font-black ${highWait ? 'text-red-600' : 'text-slate-800'}`}>
                        ~{estimatedWait}m
                      </p>
                      <p className="text-xs text-slate-400">Est. Wait</p>
                    </div>
                  </div>

                  {highWait && (
                    <div className="flex items-center gap-2 bg-amber-50 text-amber-700 text-xs font-semibold px-3 py-2 rounded-xl">
                      <AlertCircle size={12} /> High waiting time today
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <Calendar size={24} className="text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-400 font-medium">
                    {queue?.status === 'ended' ? 'Clinic ended today' : 'Not started yet'}
                  </p>
                </div>
              )}
            </div>

            {/* Fee */}
            {doctor.consultationFee > 0 && (
              <div className="bg-white rounded-2xl border border-slate-100 px-4 py-3 flex justify-between items-center">
                <span className="text-sm text-slate-600 font-medium">Consultation Fee</span>
                <span className="text-base font-black text-slate-900">₹{doctor.consultationFee}</span>
              </div>
            )}

            {isOpen ? (
              <Link href={`/book/${doctor._id}`}
                className="w-full h-14 bg-teal-700 text-white font-black rounded-2xl hover:bg-teal-800 transition-colors flex items-center justify-center gap-2 text-base shadow-lg shadow-teal-200">
                Book Appointment <ChevronRight size={18} />
              </Link>
            ) : (
              <button disabled
                className="w-full h-14 bg-slate-100 text-slate-400 font-black rounded-2xl cursor-not-allowed text-base">
                Booking Closed
              </button>
            )}

            <p className="text-xs text-slate-400 text-center">Free cancellation · Pay at clinic</p>
          </div>
        </div>
      </div>
    </div>
  );
}