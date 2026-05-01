'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, MapPin, ArrowRight, HeartPulse, ChevronRight, Star, Zap, Shield, Users, Stethoscope } from 'lucide-react';
import DoctorCard from '../components/doctor/DoctorCard.jsx';

const SPECS = [
  'General Physician','Cardiologist','Dermatologist','Orthopedic','Pediatrician',
  'Neurologist','ENT Specialist','Gynecologist','Psychiatrist','Dentist',
];

const STEPS = [
  { n: '01', title: 'Find Your Doctor', desc: 'Search by name, specialty, or location. Use GPS to find nearby doctors instantly.', color: 'from-blue-500 to-blue-700' },
  { n: '02', title: 'Book in Seconds', desc: 'Enter your name and phone. Confirm your slot. No lengthy forms, no waiting.', color: 'from-brand-500 to-brand-700' },
  { n: '03', title: 'Track Live Queue', desc: 'Get a token number and watch your position in real-time from anywhere.', color: 'from-violet-500 to-violet-700' },
];

const STATS = [
  { v: '50,000+', l: 'Patients Served', Icon: Users },
  { v: '2,000+',  l: 'Verified Doctors', Icon: Stethoscope },
  { v: '4.8 ★',   l: 'Avg Rating', Icon: Star },
  { v: '< 2 min', l: 'Booking Time', Icon: Zap },
];

export default function HomeClient({ featuredDoctors }) {
  const [query, setQuery] = useState('');
  const [locating, setLocating] = useState(false);
  const router = useRouter();

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  const handleNearby = () => {
    setLocating(true);
    navigator.geolocation?.getCurrentPosition(
      ({ coords }) => { router.push(`/search?lat=${coords.latitude}&lng=${coords.longitude}&nearby=true`); },
      () => { alert('Enable location access and try again.'); setLocating(false); }
    );
  };

  return (
    <div>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-brand-950 to-slate-900 min-h-[88vh] flex items-center">
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #16a35a22 0%, transparent 50%), radial-gradient(circle at 80% 20%, #22c57322 0%, transparent 40%)' }} />
        <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(22,163,90,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(22,163,90,0.03) 1px, transparent 1px)', backgroundSize: '48px 48px' }} />

        <div className="section relative w-full py-24">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-semibold px-4 py-2 rounded-full mb-6 animate-fade-up">
              <span className="live-dot" />
              Real-time Queue Management · Live Across India
            </div>

            <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold text-white leading-[1.08] tracking-tight mb-6 animate-fade-up animate-delay-100">
              Skip the Wait,<br />
              <span className="text-gradient">Not the Doctor</span>
            </h1>

            <p className="text-lg text-slate-400 mb-10 max-w-lg mx-auto leading-relaxed animate-fade-up animate-delay-200">
              Book appointments in seconds. Get a real-time token. Track your queue from home.
            </p>

            {/* Search bar */}
            <form onSubmit={handleSearch} className="animate-fade-up animate-delay-300">
              <div className="flex items-center bg-white rounded-2xl shadow-2xl p-1.5 gap-1.5 max-w-2xl mx-auto">
                <div className="flex items-center gap-3 flex-1 px-3">
                  <Search size={17} className="text-slate-400 flex-shrink-0" />
                  <input type="text" value={query} onChange={e => setQuery(e.target.value)}
                    placeholder="Search doctors, specializations, clinics..."
                    className="flex-1 py-3 bg-transparent outline-none text-slate-800 placeholder-slate-400 text-sm min-w-0" />
                </div>
                <button type="button" onClick={handleNearby} disabled={locating}
                  className="hidden sm:flex items-center gap-2 px-4 py-3 bg-slate-50 hover:bg-slate-100 text-slate-600 text-sm font-semibold rounded-xl transition-colors border-x border-slate-100 flex-shrink-0">
                  <MapPin size={14} className="text-brand-500" />{locating ? 'Locating…' : 'Nearby'}
                </button>
                <button type="submit" className="btn-primary rounded-xl py-3 flex-shrink-0">
                  Search <ArrowRight size={15} />
                </button>
              </div>
            </form>

            {/* Quick speciality pills */}
            <div className="flex flex-wrap justify-center gap-2 mt-5 animate-fade-up" style={{ animationDelay: '350ms' }}>
              {['Cardiologist','Dermatologist','Pediatrician','General Physician'].map(s => (
                <button key={s} onClick={() => router.push(`/search?q=${s}`)}
                  className="text-xs font-medium px-3.5 py-1.5 bg-white/8 hover:bg-white/15 text-slate-400 hover:text-white rounded-full border border-white/10 transition-all">
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 56" preserveAspectRatio="none" className="w-full h-10 fill-neutral-50">
            <path d="M0,56 C360,0 720,40 1080,16 C1260,4 1380,32 1440,20 L1440,56Z" />
          </svg>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="section -mt-3 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {STATS.map(({ v, l, Icon }) => (
            <div key={l} className="card p-5 text-center animate-fade-up">
              <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Icon size={18} className="text-brand-600" />
              </div>
              <p className="text-2xl font-extrabold text-slate-900">{v}</p>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">{l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Specializations ── */}
      <section className="section py-16">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="section-title">Browse by Specialty</h2>
            <p className="text-slate-500 text-sm mt-1">Find the right specialist for your needs</p>
          </div>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-5 gap-3">
          {SPECS.map(spec => (
            <button key={spec} onClick={() => router.push(`/search?q=${spec}`)}
              className="card-hover p-3.5 text-center group">
              <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center mx-auto mb-2 group-hover:bg-brand-100 transition-colors">
                <HeartPulse size={17} className="text-brand-600" />
              </div>
              <p className="text-xs font-semibold text-slate-700 leading-tight">{spec}</p>
            </button>
          ))}
        </div>
      </section>

      {/* ── Featured Doctors ── */}
      {featuredDoctors.length > 0 && (
        <section className="section pb-16">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="section-title">Top Doctors</h2>
              <p className="text-slate-500 text-sm mt-1">Highly rated · Available today</p>
            </div>
            <Link href="/search" className="btn-ghost text-sm text-brand-600 font-semibold">
              View all <ChevronRight size={15} />
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {featuredDoctors.map(d => <DoctorCard key={d._id} doctor={d} />)}
          </div>
        </section>
      )}

      {/* ── How it works ── */}
      <section className="bg-slate-900 py-16">
        <div className="section">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-extrabold text-white">How Opdify Works</h2>
            <p className="text-slate-400 text-sm mt-2">Get started in under 2 minutes</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {STEPS.map(({ n, title, desc, color }) => (
              <div key={n} className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 text-center hover:border-brand-500/30 transition-all">
                <div className={`w-14 h-14 bg-gradient-to-br ${color} rounded-2xl flex items-center justify-center mx-auto mb-4 text-white font-extrabold text-lg shadow-lg`}>{n}</div>
                <h3 className="text-white font-bold text-lg mb-2">{title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

{/* ── Why Choose Us ──  
   
      <section className="section py-16">
        <div className="bg-gradient-to-r from-brand-600 to-brand-800 rounded-3xl p-8 md:p-12 text-white text-center relative overflow-hidden">
          <div className="absolute -top-16 -right-16 w-56 h-56 bg-white/5 rounded-full" />
          <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-white/5 rounded-full" />
          <div className="relative">
            <h2 className="text-3xl md:text-4xl font-extrabold mb-3">Are you a Doctor?</h2>
            <p className="text-brand-100 mb-6 text-base max-w-md mx-auto">
              Join Opdify. Manage your queue digitally. Reduce chaos, increase efficiency.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <Link href="/register-doctor" className="bg-white text-brand-700 font-bold px-8 py-3.5 rounded-xl hover:bg-brand-50 transition-colors text-sm">
                Register Your Clinic
              </Link>
              <Link href="/search" className="border border-white/30 text-white px-8 py-3.5 rounded-xl hover:bg-white/10 transition-colors text-sm font-semibold">
                Browse Doctors
              </Link>
            </div>
          </div>
        </div>
      </section> 
      */}
    </div>
  );
}
