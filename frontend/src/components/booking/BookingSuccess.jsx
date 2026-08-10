import { CheckCircle2, Calendar, Clock, User, Scissors, Phone, MapPin, Sparkles } from 'lucide-react';

export default function BookingSuccess({ bookingDetails, onClose }) {
  return (
    <div className="py-2 space-y-5 animate-in fade-in zoom-in-95 duration-200 text-stone-100">
      <div className="w-16 h-16 bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded-full flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(245,158,11,0.25)]">
        <CheckCircle2 size={36} />
      </div>

      <div className="text-center">
        <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-amber-400 bg-amber-950/60 px-3 py-1 rounded-full border border-amber-500/30 mb-2">
          <Sparkles size={11} /> Booking Confirmed
        </span>
        <h3 className="text-2xl font-black text-amber-100 font-serif">You're All Set!</h3>
        <p className="text-xs text-stone-400 mt-1">We've reserved your slot. See you soon!</p>
      </div>

      {/* Детали записи */}
      <div className="bg-stone-800/60 border border-stone-700/60 rounded-2xl p-4 space-y-3.5">
        <div className="flex items-center justify-between text-xs pb-2 border-b border-stone-700/50">
          <span className="text-stone-400">Service</span>
          <span className="font-extrabold text-amber-300 flex items-center gap-1.5">
            <Scissors size={13} /> {bookingDetails?.serviceTitle || 'Service'}
          </span>
        </div>

        <div className="flex items-center justify-between text-xs pb-2 border-b border-stone-700/50">
          <span className="text-stone-400">Specialist</span>
          <span className="font-bold text-stone-100 flex items-center gap-1.5">
            <User size={13} className="text-amber-400" /> {bookingDetails?.staffName || 'Barber'}
          </span>
        </div>

        <div className="flex items-center justify-between text-xs pb-2 border-b border-stone-700/50">
          <span className="text-stone-400">Date & Time</span>
          <span className="font-bold text-stone-100 flex items-center gap-1.5">
            <Calendar size={13} className="text-amber-400" /> {bookingDetails?.date} at {bookingDetails?.time}
          </span>
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-stone-400">Total Price</span>
          <span className="font-black text-amber-400 text-sm">
            ${bookingDetails?.price}
          </span>
        </div>
      </div>

      <button
        onClick={onClose}
        className="w-full bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-stone-950 font-black py-3.5 rounded-2xl shadow-[0_0_20px_rgba(245,158,11,0.2)] transition-all text-xs uppercase tracking-widest mt-2"
      >
        Done
      </button>
    </div>
  );
}