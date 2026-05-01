import Link from 'next/link';
import { Home, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-8xl font-black text-slate-100 select-none">404</p>
        <h1 className="text-2xl font-extrabold text-slate-800 mt-2 mb-2">Page Not Found</h1>
        <p className="text-slate-500 text-sm mb-8 max-w-xs mx-auto">The page you're looking for doesn't exist.</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/" className="btn-primary"><Home size={15} /> Go Home</Link>
          <Link href="/search" className="btn-secondary"><Search size={15} /> Find Doctors</Link>
        </div>
      </div>
    </div>
  );
}
