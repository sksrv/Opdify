'use client';
import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, MapPin, X, SlidersHorizontal } from 'lucide-react';
import api from '../../lib/api.js';
import DoctorCard from '../../components/doctor/DoctorCard.jsx';

const SPECS = ['All','General Physician','Cardiologist','Dermatologist','Orthopedic','Pediatrician','Neurologist','ENT Specialist','Gynecologist','Dentist','Psychiatrist','Ophthalmologist'];

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const [spec,    setSpec]    = useState('All');
  const [query,   setQuery]   = useState(searchParams.get('q') || '');
  const [locating,setLocating]= useState(false);

  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');
  const isNearby = searchParams.get('nearby') === 'true';

  const fetchDoctors = useCallback(async (p = 1, reset = true) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: p, limit: 9 });
      if (query) params.set('search', query);
      if (spec !== 'All') params.set('specialization', spec);
      if (lat && lng) { params.set('lat', lat); params.set('lng', lng); }
      const { data } = await api.get(`/doctors?${params}`);
      setDoctors(reset ? data.data : prev => [...prev, ...data.data]);
      setTotal(data.pagination?.total || 0);
      setPage(p);
    } catch {} finally { setLoading(false); }
  }, [query, spec, lat, lng]);

  useEffect(() => { fetchDoctors(1, true); }, [spec, lat, lng]);

  const handleSearch = (e) => { e.preventDefault(); fetchDoctors(1, true); };

  const detectNearby = () => {
    setLocating(true);
    navigator.geolocation?.getCurrentPosition(
      ({ coords }) => {
        router.push(`/search?lat=${coords.latitude}&lng=${coords.longitude}&nearby=true`);
        setLocating(false);
      },
      () => { alert('Location access denied'); setLocating(false); }
    );
  };

  const Skeleton = () => (
    <div className="bg-white rounded-2xl border border-slate-100 p-4 animate-pulse">
      <div className="flex gap-3"><div className="w-14 h-14 bg-slate-100 rounded-2xl flex-shrink-0" /><div className="flex-1 space-y-2"><div className="h-4 bg-slate-100 rounded w-3/4" /><div className="h-3 bg-slate-100 rounded w-1/2" /><div className="h-3 bg-slate-100 rounded w-2/3" /></div></div>
      <div className="mt-4 pt-3 border-t border-slate-50 flex justify-between"><div className="h-3 bg-slate-100 rounded w-1/4" /><div className="h-8 bg-slate-100 rounded-xl w-24" /></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-10">
      {/* Search header */}
      <div className="bg-teal-700 px-4 pt-6 pb-5">
        <div className="max-w-5xl mx-auto">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="flex-1 flex items-center bg-white rounded-2xl px-4 gap-3">
              <Search size={16} className="text-slate-400 flex-shrink-0" />
              <input type="text" value={query} onChange={e => setQuery(e.target.value)}
                placeholder="Search doctors, specializations, clinics…"
                className="flex-1 py-3.5 bg-transparent outline-none text-slate-800 placeholder-slate-400 text-sm min-w-0" />
              {query && (
                <button type="button" onClick={() => setQuery('')} className="text-slate-400 hover:text-slate-600">
                  <X size={14} />
                </button>
              )}
            </div>
            <button type="submit" className="h-12 px-5 bg-teal-900 text-white font-bold rounded-2xl hover:bg-teal-950 transition-colors text-sm">
              Search
            </button>
          </form>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 pt-5">
        {/* Filters */}
        <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-1 no-scrollbar">
          <button onClick={detectNearby} disabled={locating}
            className="flex items-center gap-1.5 h-8 px-3 text-xs font-bold bg-white border border-teal-200 text-teal-700 rounded-full hover:bg-teal-50 transition-colors flex-shrink-0 disabled:opacity-50">
            <MapPin size={12} /> {locating ? 'Detecting…' : 'Nearby'}
          </button>

          {isNearby && (
            <span className="flex items-center gap-1.5 h-8 px-3 text-xs font-bold bg-teal-100 text-teal-700 rounded-full flex-shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" /> Nearby
            </span>
          )}

          {SPECS.map(s => (
            <button key={s} onClick={() => setSpec(s)}
              className={`flex-shrink-0 text-xs font-bold h-8 px-3.5 rounded-full border transition-all ${spec===s ? 'bg-teal-700 text-white border-teal-700' : 'bg-white text-slate-600 border-slate-200 hover:border-teal-300'}`}>
              {s}
            </button>
          ))}
        </div>

        {/* Count */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-slate-500">
            {loading ? 'Searching…'
              : <><strong className="text-slate-800">{total}</strong> doctor{total!==1?'s':''} found{query&&<> for "<em className="text-teal-700">{query}</em>"</>}</>}
          </p>
        </div>

        {/* Grid */}
        {loading && doctors.length === 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_,i) => <Skeleton key={i} />)}
          </div>
        ) : doctors.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 py-20 text-center">
            <Search size={40} className="text-slate-200 mx-auto mb-4" />
            <h3 className="font-bold text-slate-500 text-lg">No doctors found</h3>
            <p className="text-slate-400 text-sm mt-1">Try different keywords or remove filters</p>
            <button onClick={() => { setQuery(''); setSpec('All'); fetchDoctors(1,true); }}
              className="mt-4 h-9 px-5 bg-teal-700 text-white text-sm font-bold rounded-xl hover:bg-teal-800 transition-colors">
              Clear all filters
            </button>
          </div>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {doctors.map(d => <DoctorCard key={d._id} doctor={d} />)}
            </div>
            {doctors.length < total && (
              <div className="flex justify-center mt-8">
                <button onClick={() => fetchDoctors(page+1, false)} disabled={loading}
                  className="h-11 px-8 bg-white border border-slate-200 text-slate-700 font-bold rounded-2xl hover:bg-slate-50 transition-colors text-sm">
                  {loading ? 'Loading…' : `Load More (${total - doctors.length} remaining)`}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
