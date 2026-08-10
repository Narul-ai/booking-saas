import { useMemo } from 'react';
import { Clock, CheckCircle2, Ban } from 'lucide-react';
import { generateAvailableSlots } from '../utils/bookingUtils';

export default function TimeSlotPicker({ 
  selectedServiceDuration = 45, 
  existingBookings = [], 
  selectedTime, 
  onSelectTime 
}) {
  // Вычисляем слоты при изменении длительности услуги или занятых записей
  const slots = useMemo(() => {
    return generateAvailableSlots({
      workStart: '09:00',
      workEnd: '21:00',
      serviceDuration: selectedServiceDuration,
      existingBookings: existingBookings, // например: [{ start: "11:00", end: "11:45" }]
      slotInterval: 30
    });
  }, [selectedServiceDuration, existingBookings]);

  return (
    <div className="space-y-3 bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5 uppercase tracking-wider">
          <Clock size={14} className="text-amber-400" />
          <span>Available Time Slots</span>
        </label>
        <span className="text-[11px] text-zinc-400 font-medium">
          Duration: <strong className="text-amber-400">{selectedServiceDuration} min</strong>
        </span>
      </div>

      {/* Сетка тайм-слотов */}
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
        {slots.map((slot) => {
          const isSelected = selectedTime === slot.time;

          if (!slot.available) {
            return (
              <button
                key={slot.time}
                type="button"
                disabled
                className="py-2.5 px-2 rounded-xl bg-zinc-950/40 border border-zinc-800/50 text-zinc-600 text-xs font-semibold flex items-center justify-center gap-1 cursor-not-allowed opacity-60"
              >
                <Ban size={12} className="text-zinc-600" />
                <span className="line-through">{slot.time}</span>
              </button>
            );
          }

          return (
            <button
              key={slot.time}
              type="button"
              onClick={() => onSelectTime(slot.time)}
              className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all duration-150 flex items-center justify-center gap-1.5 border cursor-pointer ${
                isSelected
                  ? 'bg-amber-500 text-zinc-950 border-amber-400 shadow-lg shadow-amber-500/20 scale-[1.02]'
                  : 'bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-200 border-zinc-700/60 hover:border-amber-500/40'
              }`}
            >
              {isSelected && <CheckCircle2 size={13} className="shrink-0" />}
              <span>{slot.time}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}