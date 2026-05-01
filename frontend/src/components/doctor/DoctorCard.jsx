'use client';
import Link from 'next/link';
import { Star, Clock, MapPin, BadgeCheck, Phone } from 'lucide-react';

export default function DoctorCard({ doctor }) {
  const isOpen = doctor.isBookingOpen;
  return (
    <div className="bg-white rounded-2xl border border-slate-100 hover:border-teal-200 hover:shadow-lg transition-all duration-200 overflow-hidden group">
      {/* Top strip */}
      <div className={`h-1.5 ${isOpen ? 'bg-teal-500' : 'bg-slate-200'}`} />

      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-100 to-teal-200 flex items-center justify-center overflow-hidden">
              {doctor.avatar
                ? <img src={doctor.avatar} alt={doctor.name} className="w-full h-full object-cover" />
                : <span className="text-teal-700 font-black text-2xl">{doctor.name?.charAt(0)}</span>}
            </div>
            {doctor.isVerified && (
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-teal-500 rounded-full flex items-center justify-center ring-2 ring-white">
                <BadgeCheck size={11} className="text-white" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-bold text-slate-900 text-[15px] leading-snug truncate group-hover:text-teal-700 transition-colors">{doctor.name}</h3>
                <p className="text-teal-600 text-xs font-semibold mt-0.5">{doctor.specialization}</p>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${isOpen ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 text-slate-500'}`}>
                {isOpen ? 'Open' : 'Closed'}
              </span>
            </div>

            <div className="flex flex-wrap gap-3 mt-2">
              {doctor.rating > 0 && (
                <span className="flex items-center gap-1 text-xs text-slate-600">
                  <Star size={11} className="text-amber-400 fill-amber-400" />
                  <strong>{doctor.rating?.toFixed(1)}</strong>
                  <span className="text-slate-400">({doctor.reviewCount})</span>
                </span>
              )}
              {doctor.experience > 0 && (
                <span className="flex items-center gap-1 text-xs text-slate-500">
                  <Clock size={10} />{doctor.experience}y exp
                </span>
              )}
              {doctor.clinicAddress?.city && (
                <span className="flex items-center gap-1 text-xs text-slate-500">
                  <MapPin size={10} />{doctor.clinicAddress.city}
                </span>
              )}
            </div>

            {doctor.clinicName && (
              <p className="text-xs text-slate-400 mt-1.5 truncate">{doctor.clinicName}</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-50">
          <div>
            {doctor.consultationFee > 0
              ? <span className="text-sm font-black text-slate-900">₹{doctor.consultationFee}<span className="text-xs font-normal text-slate-400"> / visit</span></span>
              : <span className="text-xs text-slate-400 font-medium">Fee at clinic</span>}
          </div>
          <div className="flex gap-2">
            <Link href={`/doctor/${doctor._id}`}
              className="h-8 px-3 text-xs font-bold text-teal-700 border border-teal-200 rounded-xl hover:bg-teal-50 transition-colors flex items-center">
              View
            </Link>
            {isOpen && (
              <Link href={`/book/${doctor._id}`}
                className="h-8 px-4 text-xs font-bold bg-teal-700 text-white rounded-xl hover:bg-teal-800 transition-colors flex items-center">
                Book
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
