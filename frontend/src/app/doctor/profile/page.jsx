'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Camera, Save, MapPin, Phone, Clock, Star, Users, BadgeCheck,
  Edit3, X, ChevronRight, LayoutDashboard, Stethoscope, Award,
  Calendar, Hash, TrendingUp, CheckCircle2, AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext.jsx';
import api from '../../../lib/api.js';
import toast from 'react-hot-toast';

const SPECS = [
  'General Physician','Cardiologist','Dermatologist','Orthopedic Surgeon',
  'Pediatrician','Neurologist','ENT Specialist','Gynecologist','Psychiatrist',
  'Ophthalmologist','Dentist','Urologist','Gastroenterologist','Endocrinologist',
  'Pulmonologist','Rheumatologist','Oncologist','Diabetologist',
];

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = 'text', className = '' }) {
  return (
    <input type={type} value={value} onChange={onChange} placeholder={placeholder}
      className={`w-full h-11 px-4 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-400 transition-all ${className}`} />
  );
}

export default function DoctorProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const fileRef = useRef();

  const [doctor, setDoctor]       = useState(null);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing]     = useState(false);
  const [locating, setLocating]   = useState(false);

  const [form, setForm] = useState({
    name: '', specialization: '', qualifications: '', experience: '',
    bio: '', clinicName: '', phone: '',
    street: '', city: '', state: '', pincode: '',
    avgTimePerPatient: 15, maxPatientsPerDay: 30, consultationFee: 0,
    workingHours: { start: '09:00', end: '18:00' },
    workingDays: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],
    lat: '', lng: '',
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const fetchDoctor = async () => {
    try {
      const { data } = await api.get('/doctors/me');
      const d = data.data.doctor;
      setDoctor(d);
      setForm({
        name: d.name || '',
        specialization: d.specialization || '',
        qualifications: d.qualifications?.join(', ') || '',
        experience: d.experience || '',
        bio: d.bio || '',
        clinicName: d.clinicName || '',
        phone: d.phone || '',
        street: d.clinicAddress?.street || '',
        city: d.clinicAddress?.city || '',
        state: d.clinicAddress?.state || '',
        pincode: d.clinicAddress?.pincode || '',
        avgTimePerPatient: d.avgTimePerPatient || 15,
        maxPatientsPerDay: d.maxPatientsPerDay || 30,
        consultationFee: d.consultationFee || 0,
        workingHours: d.workingHours || { start: '09:00', end: '18:00' },
        workingDays: d.workingDays || ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],
        lat: d.location?.coordinates?.[1] || '',
        lng: d.location?.coordinates?.[0] || '',
      });
    } catch { toast.error('Failed to load profile'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'doctor') { router.push('/'); return; }
    fetchDoctor();
  }, [authLoading, user]);

  const detectLocation = () => {
    setLocating(true);
    navigator.geolocation?.getCurrentPosition(
      ({ coords }) => {
        set('lat', coords.latitude.toFixed(6));
        set('lng', coords.longitude.toFixed(6));
        toast.success('Location captured ✅');
        setLocating(false);
      },
      () => { toast.error('Location access denied'); setLocating(false); }
    );
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Max file size is 5MB'); return; }
    setUploading(true);
    const fd = new FormData();
    fd.append('avatar', file);
    try {
      const { data } = await api.post('/upload/avatar', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      await fetchDoctor();
      toast.success('Profile photo updated!');
    } catch { toast.error('Upload failed. Check Cloudinary settings.'); }
    finally { setUploading(false); }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        specialization: form.specialization,
        qualifications: form.qualifications.split(',').map(s => s.trim()).filter(Boolean),
        experience: Number(form.experience) || 0,
        bio: form.bio,
        clinicName: form.clinicName,
        phone: form.phone,
        clinicAddress: { street: form.street, city: form.city, state: form.state, pincode: form.pincode, country: 'India' },
        avgTimePerPatient: Number(form.avgTimePerPatient),
        maxPatientsPerDay: Number(form.maxPatientsPerDay),
        consultationFee: Number(form.consultationFee),
        workingHours: form.workingHours,
        workingDays: form.workingDays,
        ...(form.lat && form.lng && {
          location: { type: 'Point', coordinates: [parseFloat(form.lng), parseFloat(form.lat)] }
        }),
      };
      await api.put('/doctors/profile', payload);
      await fetchDoctor();
      setEditing(false);
      toast.success('Profile saved successfully!');
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  if (loading || !doctor) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="w-12 h-12 border-3 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-20">

      {/* HEADER */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link href="/doctor/dashboard" className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors">
              <LayoutDashboard size={16} />
              <span className="text-sm font-semibold hidden sm:block">Dashboard</span>
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-sm font-bold text-slate-900">Profile</span>
          </div>
          <div className="flex items-center gap-2">
            {editing ? (
              <>
                <button onClick={() => setEditing(false)}
                  className="h-9 px-4 text-sm font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
                <button onClick={handleSave} disabled={saving}
                  className="h-9 px-4 text-sm font-bold bg-teal-700 text-white rounded-xl hover:bg-teal-800 transition-colors flex items-center gap-2 disabled:opacity-50">
                  {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save size={14} /> Save Changes</>}
                </button>
              </>
            ) : (
              <button onClick={() => setEditing(true)}
                className="h-9 px-4 text-sm font-bold bg-teal-700 text-white rounded-xl hover:bg-teal-800 transition-colors flex items-center gap-2">
                <Edit3 size={14} /> Edit Profile
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 pt-6 space-y-5">

        {/* PROFILE CARD */}
        <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden">
          {/* Cover */}
          <div className="h-28 bg-gradient-to-br from-teal-600 to-teal-900 relative">
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 30% 50%, white 0%, transparent 60%)' }} />
          </div>

          <div className="px-5 pb-5">
            {/* Avatar */}
            <div className="flex items-end justify-between -mt-12 mb-4">
              <div className="relative">
                <div className="w-24 h-24 rounded-2xl border-4 border-white shadow-lg overflow-hidden bg-gradient-to-br from-teal-400 to-teal-700">
                  {doctor.avatar
                    ? <img src={doctor.avatar} alt={doctor.name} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-white font-black text-3xl">{doctor.name?.charAt(0)}</div>}
                </div>
                <button onClick={() => fileRef.current?.click()} disabled={uploading}
                  className="absolute -bottom-1 -right-1 w-8 h-8 bg-teal-700 rounded-xl flex items-center justify-center text-white shadow-md hover:bg-teal-800 transition-colors disabled:opacity-50">
                  {uploading ? <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Camera size={14} />}
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              </div>

              {doctor.isVerified && (
                <span className="flex items-center gap-1.5 text-xs font-bold text-teal-700 bg-teal-50 border border-teal-200 px-3 py-1.5 rounded-full">
                  <BadgeCheck size={13} /> Verified Doctor
                </span>
              )}
            </div>

            {editing ? (
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Doctor Name">
                  <Input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Dr. Full Name" />
                </Field>
                <Field label="Phone">
                  <Input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="10-digit mobile" />
                </Field>
                <Field label="Specialization">
                  <select value={form.specialization} onChange={e => set('specialization', e.target.value)}
                    className="w-full h-11 px-4 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-400">
                    <option value="">Select specialization</option>
                    {SPECS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </Field>
                <Field label="Experience (years)">
                  <Input type="number" value={form.experience} onChange={e => set('experience', e.target.value)} placeholder="0" />
                </Field>
                <Field label="Qualifications (comma separated)">
                  <Input value={form.qualifications} onChange={e => set('qualifications', e.target.value)} placeholder="MBBS, MD, DM" />
                </Field>
                <Field label="Consultation Fee (₹)">
                  <Input type="number" value={form.consultationFee} onChange={e => set('consultationFee', e.target.value)} placeholder="0" />
                </Field>
              </div>
            ) : (
              <div>
                <div className="flex items-start justify-between flex-wrap gap-2 mb-2">
                  <div>
                    <h1 className="text-2xl font-black text-slate-900">{doctor.name}</h1>
                    <p className="text-teal-600 font-bold">{doctor.specialization}</p>
                    {doctor.qualifications?.length > 0 && (
                      <p className="text-slate-500 text-sm mt-0.5">{doctor.qualifications.join(' · ')}</p>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-4 text-sm text-slate-600 mt-3">
                  {doctor.experience > 0 && (
                    <span className="flex items-center gap-1.5"><Award size={14} className="text-teal-500" />{doctor.experience} yrs experience</span>
                  )}
                  {doctor.rating > 0 && (
                    <span className="flex items-center gap-1.5"><Star size={14} className="text-amber-500 fill-amber-500" />{doctor.rating.toFixed(1)} ({doctor.reviewCount})</span>
                  )}
                  {doctor.totalPatientsSeen > 0 && (
                    <span className="flex items-center gap-1.5"><Users size={14} className="text-teal-500" />{doctor.totalPatientsSeen}+ patients</span>
                  )}
                  {doctor.consultationFee > 0 && (
                    <span className="flex items-center gap-1.5 text-teal-700 font-bold">₹{doctor.consultationFee} / visit</span>
                  )}
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400">Doctor ID:</span>
                  <button onClick={() => { navigator.clipboard.writeText(doctor.uniqueId); toast.success('ID copied!'); }}
                    className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg hover:bg-slate-200 transition-colors">
                    {doctor.uniqueId}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ABOUT */}
        <div className="bg-white rounded-3xl border border-slate-100 p-5">
          <h2 className="text-base font-black text-slate-900 mb-4">About</h2>
          {editing ? (
            <textarea value={form.bio} onChange={e => set('bio', e.target.value)}
              placeholder="Write about your expertise, experience, and approach to patient care…"
              rows={4} className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-400 resize-none" />
          ) : (
            <p className="text-sm text-slate-600 leading-relaxed">
              {doctor.bio || <span className="text-slate-400 italic">No bio added yet. Click Edit Profile to add your about section.</span>}
            </p>
          )}
        </div>

        {/* CLINIC INFO */}
        <div className="bg-white rounded-3xl border border-slate-100 p-5">
          <h2 className="text-base font-black text-slate-900 mb-4">Clinic Information</h2>
          {editing ? (
            <div className="space-y-4">
              <Field label="Clinic Name">
                <Input value={form.clinicName} onChange={e => set('clinicName', e.target.value)} placeholder="Your Clinic Name" />
              </Field>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Street Address">
                  <Input value={form.street} onChange={e => set('street', e.target.value)} placeholder="Building, Street" />
                </Field>
                <Field label="City">
                  <Input value={form.city} onChange={e => set('city', e.target.value)} placeholder="City" />
                </Field>
                <Field label="State">
                  <Input value={form.state} onChange={e => set('state', e.target.value)} placeholder="State" />
                </Field>
                <Field label="Pincode">
                  <Input value={form.pincode} onChange={e => set('pincode', e.target.value)} placeholder="6-digit pincode" />
                </Field>
              </div>

              {/* Auto location */}
              <div className="bg-teal-50 border border-teal-200 rounded-xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-teal-800">📍 Clinic Location (for map & nearby search)</p>
                    {form.lat && form.lng
                      ? <p className="text-xs text-teal-600 mt-1">Captured: {parseFloat(form.lat).toFixed(4)}, {parseFloat(form.lng).toFixed(4)}</p>
                      : <p className="text-xs text-slate-500 mt-1">Not set — patients won't see you in nearby search</p>}
                  </div>
                  <button type="button" onClick={detectLocation} disabled={locating}
                    className="flex items-center gap-2 h-9 px-4 bg-teal-700 text-white text-xs font-bold rounded-xl hover:bg-teal-800 transition-colors disabled:opacity-50 shrink-0">
                    <MapPin size={13} />
                    {locating ? 'Locating…' : form.lat ? 'Update' : 'Detect'}
                  </button>
                </div>
                {form.lat && form.lng && (
                  <div className="mt-3 bg-white rounded-lg p-2 text-xs text-slate-600">
                    Lat: {form.lat} · Lng: {form.lng}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {[
                { icon: Stethoscope, label: 'Clinic', value: doctor.clinicName },
                { icon: MapPin, label: 'Address', value: [doctor.clinicAddress?.street, doctor.clinicAddress?.city, doctor.clinicAddress?.state, doctor.clinicAddress?.pincode].filter(Boolean).join(', ') },
                { icon: Phone, label: 'Phone', value: doctor.phone },
              ].map(({ icon: Icon, label, value }) => value ? (
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

              {/* Map embed if location available */}
              {doctor.location?.coordinates?.[0] !== 0 && doctor.location?.coordinates?.length === 2 && (
                <div className="mt-4 rounded-2xl overflow-hidden border border-slate-200 h-48">
                  <iframe
                    title="Clinic Location"
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${doctor.location.coordinates[0] - 0.01},${doctor.location.coordinates[1] - 0.01},${doctor.location.coordinates[0] + 0.01},${doctor.location.coordinates[1] + 0.01}&layer=mapnik&marker=${doctor.location.coordinates[1]},${doctor.location.coordinates[0]}`}
                    className="w-full h-full border-0"
                    loading="lazy"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* SCHEDULE */}
        <div className="bg-white rounded-3xl border border-slate-100 p-5">
          <h2 className="text-base font-black text-slate-900 mb-4">Schedule</h2>
          {editing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Opening Time">
                  <input type="time" value={form.workingHours.start}
                    onChange={e => setForm(f => ({ ...f, workingHours: { ...f.workingHours, start: e.target.value } }))}
                    className="w-full h-11 px-4 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400/30" />
                </Field>
                <Field label="Closing Time">
                  <input type="time" value={form.workingHours.end}
                    onChange={e => setForm(f => ({ ...f, workingHours: { ...f.workingHours, end: e.target.value } }))}
                    className="w-full h-11 px-4 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400/30" />
                </Field>
              </div>
              <Field label="Working Days">
                <div className="flex flex-wrap gap-2 mt-1">
                  {DAYS.map(d => (
                    <button key={d} type="button"
                      onClick={() => setForm(f => ({
                        ...f,
                        workingDays: f.workingDays.includes(d)
                          ? f.workingDays.filter(x => x !== d)
                          : [...f.workingDays, d]
                      }))}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${form.workingDays.includes(d) ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                      {d.slice(0,3)}
                    </button>
                  ))}
                </div>
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Avg time/patient (min)">
                  <Input type="number" value={form.avgTimePerPatient} onChange={e => set('avgTimePerPatient', e.target.value)} />
                </Field>
                <Field label="Max patients/day">
                  <Input type="number" value={form.maxPatientsPerDay} onChange={e => set('maxPatientsPerDay', e.target.value)} />
                </Field>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-teal-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Clock size={15} className="text-teal-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-semibold">Working Hours</p>
                  <p className="text-sm text-slate-800 font-medium">{doctor.workingHours?.start} – {doctor.workingHours?.end}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {DAYS.map(d => (
                  <span key={d} className={`text-xs font-bold px-2.5 py-1 rounded-lg ${doctor.workingDays?.includes(d) ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 text-slate-400 line-through'}`}>
                    {d.slice(0,3)}
                  </span>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3 mt-2">
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-slate-400 font-semibold">Avg time/patient</p>
                  <p className="text-base font-black text-slate-800">{doctor.avgTimePerPatient} min</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-slate-400 font-semibold">Max patients/day</p>
                  <p className="text-base font-black text-slate-800">{doctor.maxPatientsPerDay}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* SAVE BUTTON (mobile sticky) */}
        {editing && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 sm:hidden z-30">
            <button onClick={handleSave} disabled={saving}
              className="w-full h-12 bg-teal-700 text-white font-black rounded-2xl hover:bg-teal-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
              {saving ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save size={18} /> Save Profile</>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
