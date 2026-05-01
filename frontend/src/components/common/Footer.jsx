import Link from 'next/link';
import { Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div className="col-span-2">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 bg-teal-700 rounded-xl flex items-center justify-center">
                <span className="text-white font-black text-xs">CQ</span>
              </div>
              <span className="font-black text-lg text-white">Clin<span className="text-teal-400">IQ</span></span>
            </div>
            <p className="text-sm leading-relaxed max-w-xs text-slate-500">
              Smart clinic appointment & live queue management. Reduce waiting time, improve patient experience.
            </p>
            <div className="flex items-center gap-1.5 mt-3 text-xs text-slate-600">
              <span>Built with</span><Heart size={11} className="text-red-400 fill-red-400" /><span>for better healthcare in India</span>
            </div>
          </div>
          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3">Platform</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/search" className="hover:text-teal-400 transition-colors">Find Doctors</Link></li>
              <li><Link href="/register-doctor" className="hover:text-teal-400 transition-colors">Register Clinic</Link></li>
              <li><Link href="/my-appointments" className="hover:text-teal-400 transition-colors">My Appointments</Link></li>
              <li><Link href="/profile" className="hover:text-teal-400 transition-colors">My Profile</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3">Contact</h4>
            <ul className="space-y-2 text-sm">
              <li>hello@Opdify.in</li>
              <li>1800-Opdify-1</li>
              <li>New Delhi, India</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row justify-between gap-2 text-xs text-slate-600">
          <span>© 2025 Opdify Technologies Pvt. Ltd. All rights reserved.</span>
          <div className="flex gap-4">
            <a href="#" className="hover:text-slate-400 transition-colors">Privacy</a>
            <a href="#" className="hover:text-slate-400 transition-colors">Terms</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
