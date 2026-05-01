import { notFound } from 'next/navigation';
import DoctorProfileClient from './DoctorProfileClient.jsx';

async function getDoctor(id) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/doctors/${id}`,
      { next: { revalidate: 30 } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.data;
  } catch { return null; }
}

export async function generateMetadata({ params }) {
  const doctor = await getDoctor(params.id);
  if (!doctor) return { title: 'Doctor Not Found' };
  return {
    title: `${doctor.name} — ${doctor.specialization}`,
    description: `Book appointment with ${doctor.name}. ${doctor.specialization} at ${doctor.clinicName || 'clinic'}. Real-time queue tracking.`,
  };
}

export default async function DoctorProfilePage({ params }) {
  const doctor = await getDoctor(params.id);
  if (!doctor) notFound();
  return <DoctorProfileClient doctor={doctor} />;
}
