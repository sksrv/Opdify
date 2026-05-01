'use client';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  Menu,
  X,
  ChevronDown,
  LayoutDashboard,
  Calendar,
  User,
  LogOut,
  Stethoscope,
} from 'lucide-react';
import AuthModal from './AuthModal.jsx';

export default function Navbar() {
  const { user, logout, isDoctor } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const dropRef = useRef(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    setMenuOpen(false);
    setDropOpen(false);
  }, [pathname]);

  useEffect(() => {
    const fn = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) {
        setDropOpen(false);
      }
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  if (pathname === '/doctor/dashboard' || pathname === '/doctor/profile') return null;

  const navItems = [{ href: '/search', label: 'Find Doctors' }];

  return (
    <>
      <nav className="sticky top-0 z-50 bg-white border-b border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-[68px]">

            {/* ── Logo ──
                Uses the cropped SVG (opdify-logo-cropped.svg) which has:
                - Background removed (transparent)
                - viewBox trimmed tightly to the actual logo content
                This means h-11 gives a comfortably large, sharp logo with
                zero wasted whitespace above/below.

                If you want to keep using the ORIGINAL file, replace the src
                with "/opdify-logo1.svg" and set className to
                "h-11 w-auto object-contain" — it will still work but the
                logo will appear smaller because of the large empty canvas.
            --> */}
            <Link
              href="/"
              aria-label="Opdify"
              className="shrink-0"
            >
              <Image
                src="/opdify-logo-cropped.svg"
                alt="Opdify"
                width={480}
                height={172}
                priority
                unoptimized
                draggable={false}
                className="h-16 w-auto object-contain transition-opacity duration-150 hover:opacity-85"
              />
            </Link>

            {/* ── Desktop nav ── */}
            <div className="hidden md:flex items-center gap-1">
              {navItems.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                    pathname === href
                      ? 'bg-teal-50 text-teal-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {label}
                </Link>
              ))}
            </div>

            {/* ── Right ── */}
            <div className="flex items-center gap-2">
              {user ? (
                <div className="relative" ref={dropRef}>
                  <button
                    onClick={() => setDropOpen(!dropOpen)}
                    className="flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-xl hover:bg-slate-100 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-xl overflow-hidden bg-teal-700 flex items-center justify-center text-white font-black text-sm flex-shrink-0">
                      {user.avatar ? (
                        <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        user.name?.charAt(0).toUpperCase()
                      )}
                    </div>
                    <span className="hidden sm:block text-sm font-semibold text-slate-700 max-w-[80px] truncate">
                      {user.name?.split(' ')[0]}
                    </span>
                    <ChevronDown
                      size={13}
                      className={`text-slate-400 transition-transform ${dropOpen ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {dropOpen && (
                    <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl border border-slate-100 shadow-lg py-1.5 z-50 animate-fade-in">
                      <div className="px-4 py-2.5 border-b border-slate-50 mb-1">
                        <p className="font-bold text-slate-800 text-sm">{user.name}</p>
                        <p className="text-xs text-slate-400 mt-0.5 capitalize">{user.role}</p>
                      </div>

                      <Link href="/profile" className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 text-sm text-slate-700 transition-colors">
                        <User size={14} className="text-teal-600" /> My Profile
                      </Link>

                      {isDoctor ? (
                        <>
                          <Link href="/doctor/dashboard" className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 text-sm text-slate-700 transition-colors">
                            <LayoutDashboard size={14} className="text-teal-600" /> Dashboard
                          </Link>
                          <Link href="/doctor/profile" className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 text-sm text-slate-700 transition-colors">
                            <Stethoscope size={14} className="text-teal-600" /> Doctor Profile
                          </Link>
                        </>
                      ) : (
                        <Link href="/my-appointments" className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 text-sm text-slate-700 transition-colors">
                          <Calendar size={14} className="text-teal-600" /> Appointments
                        </Link>
                      )}

                      <div className="border-t border-slate-50 mt-1 pt-1">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-50 text-sm text-red-600 transition-colors"
                        >
                          <LogOut size={14} /> Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setAuthOpen(true)}
                  className="h-9 px-5 bg-teal-700 text-white text-sm font-bold rounded-xl hover:bg-teal-800 transition-colors shadow-sm hover:shadow-md"
                >
                  Sign In
                </button>
              )}

              {/* Mobile menu toggle */}
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="md:hidden w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-100 transition-colors"
                aria-label="Toggle menu"
              >
                {menuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* ── Mobile menu ── */}
        {menuOpen && (
          <div className="md:hidden border-t border-slate-100 bg-white px-4 py-3 space-y-1 animate-fade-in">
            <Link href="/search" className="block px-3 py-3 rounded-xl hover:bg-slate-50 text-sm font-semibold text-slate-700">
              Find Doctors
            </Link>

            {user && (
              <>
                <Link href="/profile" className="block px-3 py-3 rounded-xl hover:bg-slate-50 text-sm font-semibold text-slate-700">
                  My Profile
                </Link>

                {isDoctor ? (
                  <Link href="/doctor/dashboard" className="block px-3 py-3 rounded-xl hover:bg-slate-50 text-sm font-semibold text-slate-700">
                    Dashboard
                  </Link>
                ) : (
                  <Link href="/my-appointments" className="block px-3 py-3 rounded-xl hover:bg-slate-50 text-sm font-semibold text-slate-700">
                    Appointments
                  </Link>
                )}

                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-3 py-3 rounded-xl hover:bg-red-50 text-sm font-semibold text-red-600"
                >
                  Sign Out
                </button>
              </>
            )}
          </div>
        )}
      </nav>

      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}
    </>
  );
}