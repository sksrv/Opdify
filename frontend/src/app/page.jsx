import { Suspense } from 'react';
import HomeClient from './HomeClient';

export const metadata = {
  title: 'Opdify — Smart Clinic Queue Management',
  description: 'Book doctor appointments and track your real-time queue. No more waiting rooms.',
};

async function getFeaturedDoctors() {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/doctors?limit=6&page=1`,
      { next: { revalidate: 60 } }
    );
    const data = await res.json();
    return data.data || [];
  } catch { return []; }
}

export default async function HomePage() {
  const doctors = await getFeaturedDoctors();
  return (
    <Suspense fallback={<div className="min-h-screen bg-neutral-50" />}>
      <HomeClient featuredDoctors={doctors} />
    </Suspense>
  );
}
