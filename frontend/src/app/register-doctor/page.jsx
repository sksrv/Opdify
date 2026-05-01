'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  User, Phone, Lock, Stethoscope, MapPin, Clock, Users,
  CheckCircle2, ArrowRight, Eye, EyeOff, Building2, Camera,
} from 'lucide-react';
import api from '../../lib/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import toast from 'react-hot-toast';

const SPECS = [
  'General Physician','Cardiologist','Dermatologist','Orthopedic Surgeon',
  'Pediatrician','Neurologist','ENT Specialist','Gynecologist','Psychiatrist',
  'Ophthalmologist','Dentist','Urologist','Gastroenterologist','Endocrinologist','Pulmonologist',
];

export default function RegisterDoctorPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [step, setStep] = useState(1); // 1=form 2=done
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [locating, setLocating] = useState(false);
  const [location, setLocation] = useState(null);

  const [form, setForm] = useState({
    name:'', phone:'', password:'',
    specialization:'', clinicName:'', experience:'',
    consultationFee:'', avgTimePerPatient:'15', maxPatientsPerDay:'30',
    bio:'', street:'', city:'', state:'', pincode:'',
  });
  const set = (k,v) => setForm(f => ({...f,[k]:v}));

  const detectLocation = () => {
    setLocating(true);
    navigator.geolocation?.getCurrentPosition(
      ({ coords }) => {
        setLocation({ lat: coords.latitude, lng: coords.longitude });
        toast.success('Location detected ✅');
        setLocating(false);
      },
      () => { toast.error('Location access denied'); setLocating(false); }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.password || !form.specialization) {
      toast.error('Please fill all required fields'); return;
    }
    if (form.phone.length !== 10) { toast.error('Enter valid 10-digit phone'); return; }
    if (form.password.length < 6) { toast.error('Password must be 6+ characters'); return; }

    setLoading(true);
    try {
      const payload = {
        name: form.name, phone: form.phone, password: form.password,
        role: 'doctor', specialization: form.specialization,
        clinicName: form.clinicName || `${form.name}'s Clinic`,
        experience: Number(form.experience) || 0,
        bio: form.bio,
        consultationFee: Number(form.consultationFee) || 0,
        avgTimePerPatient: Number(form.avgTimePerPatient) || 15,
        maxPatientsPerDay: Number(form.maxPatientsPerDay) || 30,
        clinicAddress: { street: form.street, city: form.city, state: form.state, pincode: form.pincode, country: 'India' },
        ...(location && { location: { type: 'Point', coordinates: [location.lng, location.lat] } }),
      };
      await api.post('/auth/register', payload);
      await login(form.phone, form.password);
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  if (step === 2) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl border border-slate-100 p-8 max-w-sm w-full text-center">
        <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <CheckCircle2 size={32} className="text-teal-600" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 mb-2">Clinic Registered!</h2>
        <p className="text-slate-500 text-sm mb-1">Dr. {form.name} · {form.specialization}</p>
        {location && <p className="text-xs text-teal-600 font-semibold mb-6">📍 Location captured</p>}
        <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4 mb-6 text-sm text-teal-700 font-medium">
          Your unique Doctor ID has been generated and is visible on your dashboard.
        </div>
        <button onClick={() => router.push('/doctor/dashboard')}
          className="w-full h-12 bg-teal-700 text-white font-black rounded-2xl hover:bg-teal-800 transition-colors flex items-center justify-center gap-2">
          Go to Dashboard <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-xl mx-auto">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-teal-50 border border-teal-200 text-teal-700 text-xs font-bold px-4 py-2 rounded-full mb-4">
            <Stethoscope size={13} /> For Doctors & Clinics
          </div>
          <h1 className="text-3xl font-black text-slate-900">Register Your Clinic</h1>
          <p className="text-slate-500 text-sm mt-2">Join Opdify to manage your queue digitally. A unique Doctor ID is auto-generated.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Personal */}
          <div className="bg-white rounded-3xl border border-slate-100 p-5 space-y-4">
            <h2 className="font-black text-slate-900">Personal Details</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Full Name *</label>
                <div className="relative">
                  <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="text" value={form.name} onChange={e => set('name', e.target.value)}
                    placeholder="Dr. Full Name" className="w-full h-11 pl-9 pr-4 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-400" required />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Phone *</label>
                <div className="relative">
                  <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value.replace(/\D/g,''))}
                    maxLength={10} placeholder="10-digit number" className="w-full h-11 pl-9 pr-4 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-400" required />
                </div>
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Password *</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type={showPass?'text':'password'} value={form.password} onChange={e => set('password',e.target.value)}
                  placeholder="Min 6 characters" className="w-full h-11 pl-9 pr-10 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-400" required />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
          </div>

          {/* Professional */}
          <div className="bg-white rounded-3xl border border-slate-100 p-5 space-y-4">
            <h2 className="font-black text-slate-900">Professional Info</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Specialization *</label>
                <div className="relative">
                  <Stethoscope size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <select value={form.specialization} onChange={e => set('specialization',e.target.value)}
                    className="w-full h-11 pl-9 pr-4 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400/30 appearance-none" required>
                    <option value="">Select specialization</option>
                    {SPECS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Experience (years)</label>
                <input type="number" min={0} value={form.experience} onChange={e => set('experience',e.target.value)}
                  placeholder="0" className="w-full h-11 px-4 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-400" />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">About You (optional)</label>
              <textarea value={form.bio} onChange={e => set('bio',e.target.value)}
                placeholder="Write about your expertise…" rows={3}
                className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400/30 resize-none" />
            </div>
          </div>

          {/* Clinic */}
          <div className="bg-white rounded-3xl border border-slate-100 p-5 space-y-4">
            <h2 className="font-black text-slate-900">Clinic Details</h2>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Clinic Name</label>
              <div className="relative">
                <Building2 size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" value={form.clinicName} onChange={e => set('clinicName',e.target.value)}
                  placeholder="Your Clinic Name" className="w-full h-11 pl-9 pr-4 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-400" />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                { key:'street', ph:'Street address' },
                { key:'city',   ph:'City' },
                { key:'state',  ph:'State' },
                { key:'pincode',ph:'Pincode' },
              ].map(({ key, ph }) => (
                <input key={key} type="text" value={form[key]} onChange={e => set(key,e.target.value)}
                  placeholder={ph} className="h-11 px-4 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-400" />
              ))}
            </div>

            {/* Auto Location */}
            <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-teal-800 flex items-center gap-1.5"><MapPin size={14} /> Auto-detect Location</p>
                  <p className="text-xs text-teal-600 mt-0.5">
                    {location ? `✅ Captured (${location.lat.toFixed(4)}, ${location.lng.toFixed(4)})` : 'Helps patients find you in nearby search'}
                  </p>
                </div>
                <button type="button" onClick={detectLocation} disabled={locating}
                  className="h-9 px-4 text-xs font-bold bg-teal-700 text-white rounded-xl hover:bg-teal-800 transition-colors disabled:opacity-50 flex items-center gap-1.5 shrink-0">
                  <MapPin size={13} /> {locating ? 'Locating…' : location ? 'Update' : 'Detect'}
                </button>
              </div>
            </div>

            {/* Queue settings */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label:'Avg time (min)', key:'avgTimePerPatient', min:1 },
                { label:'Max/day',        key:'maxPatientsPerDay', min:1 },
                { label:'Fee (₹)',        key:'consultationFee',   min:0 },
              ].map(({ label, key, min }) => (
                <div key={key}>
                  <label className="text-xs font-bold text-slate-500 mb-1.5 block">{label}</label>
                  <input type="number" min={min} value={form[key]} onChange={e => set(key,e.target.value)}
                    className="w-full h-11 px-4 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-400" />
                </div>
              ))}
            </div>
          </div>

          {/* Auto ID notice */}
          <div className="bg-gradient-to-r from-teal-50 to-teal-100 border border-teal-200 rounded-2xl p-4">
            <p className="text-sm font-bold text-teal-800">🎉 Auto-generated Doctor ID</p>
            <p className="text-xs text-teal-600 mt-1">A unique, searchable ID like <strong>DR-PRIYA-1001</strong> will be auto-created and visible on your dashboard after registration.</p>
          </div>

          <button type="submit" disabled={loading}
            className="w-full h-14 bg-teal-700 text-white font-black rounded-2xl hover:bg-teal-800 transition-colors flex items-center justify-center gap-2 text-base shadow-lg shadow-teal-200 disabled:opacity-50">
            {loading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Register Clinic <ArrowRight size={18} /></>}
          </button>

          <p className="text-xs text-slate-400 text-center">
            Already registered? <Link href="/doctor/dashboard" className="text-teal-600 font-bold hover:underline">Go to Dashboard</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
