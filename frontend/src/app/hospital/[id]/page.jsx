import { notFound } from 'next/navigation';
import DoctorCard from '../../../components/doctor/DoctorCard.jsx';
import { MapPin, Phone, Mail, BadgeCheck, Stethoscope } from 'lucide-react';

async function getHospital(id) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/hospitals/${id}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    const data = await res.json();
    return data.data;
  } catch { return null; }
}

export async function generateMetadata({ params }) {
  const h = await getHospital(params.id);
  return h ? { title: h.name, description: `Book appointments at ${h.name}` } : { title: 'Hospital Not Found' };
}

export default async function HospitalPage({ params }) {
  const hospital = await getHospital(params.id);
  if (!hospital) notFound();

  return (
    <div className="section py-8 max-w-5xl mx-auto animate-fade-up">
      <div className="card p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-5">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center flex-shrink-0 text-blue-700 font-extrabold text-3xl">
            {hospital.name?.charAt(0)}
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <h1 className="text-2xl font-extrabold text-slate-900">{hospital.name}</h1>
                {hospital.isVerified && (
                  <div className="flex items-center gap-1.5 mt-1">
                    <BadgeCheck size={14} className="text-brand-500" />
                    <span className="text-xs text-brand-600 font-medium">Verified Hospital</span>
                  </div>
                )}
              </div>
              <span className="badge badge-blue">{hospital.uniqueId}</span>
            </div>
            {hospital.description && <p className="text-slate-600 text-sm leading-relaxed mb-3">{hospital.description}</p>}
            <div className="flex flex-wrap gap-4 text-sm text-slate-600">
              {hospital.address?.city && <span className="flex items-center gap-1.5"><MapPin size={13} className="text-brand-500" />{[hospital.address.street, hospital.address.city, hospital.address.state].filter(Boolean).join(', ')}</span>}
              {hospital.phone && <span className="flex items-center gap-1.5"><Phone size={13} className="text-brand-500" />{hospital.phone}</span>}
              {hospital.email && <span className="flex items-center gap-1.5"><Mail size={13} className="text-brand-500" />{hospital.email}</span>}
            </div>
            {hospital.specializations?.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {hospital.specializations.map(s => <span key={s} className="badge badge-green text-xs">{s}</span>)}
              </div>
            )}
          </div>
        </div>
      </div>

      <div>
        <h2 className="section-title mb-4">Doctors <span className="text-slate-400 font-normal text-xl">({hospital.doctors?.length || 0})</span></h2>
        {hospital.doctors?.length === 0 ? (
          <div className="card p-12 text-center"><Stethoscope size={32} className="text-slate-200 mx-auto mb-3" /><p className="text-slate-400 text-sm">No doctors listed yet</p></div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {hospital.doctors.map(d => <DoctorCard key={d._id} doctor={d} />)}
          </div>
        )}
      </div>
    </div>
  );
}
