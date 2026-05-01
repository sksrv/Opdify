'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, MapPin, X } from 'lucide-react';
import api from '../../lib/api.js';
import DoctorCard from '../../components/doctor/DoctorCard.jsx';

const SPECS = ['All','General Physician','Cardiologist','Dermatologist','Orthopedic','Pediatrician','Neurologist','ENT Specialist','Gynecologist','Dentist','Psychiatrist','Ophthalmologist'];

function SearchContent() {
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
    } catch {} 
    finally { setLoading(false); }
  }, [query, spec, lat, lng]);

  useEffect(() => { fetchDoctors(1, true); }, [spec, lat, lng]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchDoctors(1, true);
  };

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
      <div className="flex gap-3">
        <div className="w-14 h-14 bg-slate-100 rounded-2xl flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-slate-100 rounded w-3/4" />
          <div className="h-3 bg-slate-100 rounded w-1/2" />
          <div className="h-3 bg-slate-100 rounded w-2/3" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-10">

      {/* UI remains SAME */}
      <div className="bg-teal-700 px-4 pt-6 pb-5">
        <div className="max-w-5xl mx-auto">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="flex-1 flex items-center bg-white rounded-2xl px-4 gap-3">
              <Search size={16} className="text-slate-400" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search doctors, specializations, clinics…"
                className="flex-1 py-3.5 bg-transparent outline-none text-sm"
              />
              {query && (
                <button type="button" onClick={() => setQuery('')}>
                  <X size={14} />
                </button>
              )}
            </div>
            <button className="h-12 px-5 bg-teal-900 text-white font-bold rounded-2xl">
              Search
            </button>
          </form>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 pt-5">
        <div className="flex items-center gap-2 mb-5 overflow-x-auto">
          <button onClick={detectNearby}>
            <MapPin size={12} /> Nearby
          </button>
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_,i) => <Skeleton key={i} />)}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {doctors.map(d => <DoctorCard key={d._id} doctor={d} />)}
          </div>
        )}
      </div>
    </div>
  );
}


export default function Page() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Loading...</div>}>
      <SearchContent />
    </Suspense>
  );
}