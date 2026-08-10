import { useMemo, useState } from 'react';
import { Clock, Sun, Sunrise, Sunset, AlertCircle, Check } from 'lucide-react';

export default function TimeSlotsGrid({ generatedSlots = [], selectedSlot, onSelectSlot }) {
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'morning' | 'afternoon' | 'evening'

  // Группируем слоты по времени суток
  const categorizedSlots = useMemo(() => {
    const morning = [];
    const afternoon = [];
    const evening = [];

    generatedSlots.forEach((slot) => {
      const hour = parseInt(slot.timeLabel.split(':')[0], 10);
      
      if (hour < 12) {
        morning.push(slot);
      } else if (hour < 17) {
        afternoon.push(slot);
      } else {
        evening.push(slot);
      }
    });

    return { morning, afternoon, evening };
  }, [generatedSlots]);

  // Фильтрация для выбранной вкладки
  const visibleSlots = useMemo(() => {
    if (activeTab === 'morning') return categorizedSlots.morning;
    if (activeTab === 'afternoon') return categorizedSlots.afternoon;
    if (activeTab === 'evening') return categorizedSlots.evening;
    return generatedSlots;
  }, [activeTab, generatedSlots, categorizedSlots]);

  // Подсчёт свободных слотов
  const availableCount = useMemo(() => {
    return generatedSlots.filter((s) => !s.isDisabled && !s.isBooked && !s.isPast).length;
  }, [generatedSlots]);

  return (
    <div className="select-none space-y-2.5">
      {/* Шапка сетки */}
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-extrabold uppercase tracking-widest text-amber-400/90 flex items-center gap-1.5">
          <Clock size={13} className="text-amber-400" />
          <span>Available Time</span>
        </label>

        {/* Счётчик свободных мест */}
        {generatedSlots.length > 0 && (
          <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-stone-800 border border-stone-700/80">
            {availableCount > 0 ? (
              <span className="text-emerald-400 font-extrabold">{availableCount} free</span>
            ) : (
              <span className="text-rose-400 font-extrabold">Fully booked</span>
            )}
          </span>
        )}
      </div>

      {/* Быстрые фильтры по периодам (Morning / Afternoon / Evening) */}
      {generatedSlots.length > 0 && (
        <div className="flex items-center gap-1 p-1 bg-stone-800/80 rounded-2xl border border-stone-700/80">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`flex-1 py-1.5 px-2 rounded-xl text-[10px] font-black transition-all duration-200 ${
              activeTab === 'all'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 shadow-md shadow-amber-950/40'
                : 'text-stone-400 hover:text-amber-300'
            }`}
          >
            All ({generatedSlots.length})
          </button>
          
          <button
            type="button"
            disabled={categorizedSlots.morning.length === 0}
            onClick={() => setActiveTab('morning')}
            className={`flex items-center justify-center gap-1 flex-1 py-1.5 px-2 rounded-xl text-[10px] font-black transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed ${
              activeTab === 'morning'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 shadow-md shadow-amber-950/40'
                : 'text-stone-400 hover:text-amber-300'
            }`}
          >
            <Sunrise size={11} /> Morning
          </button>

          <button
            type="button"
            disabled={categorizedSlots.afternoon.length === 0}
            onClick={() => setActiveTab('afternoon')}
            className={`flex items-center justify-center gap-1 flex-1 py-1.5 px-2 rounded-xl text-[10px] font-black transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed ${
              activeTab === 'afternoon'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 shadow-md shadow-amber-950/40'
                : 'text-stone-400 hover:text-amber-300'
            }`}
          >
            <Sun size={11} /> Afternoon
          </button>

          <button
            type="button"
            disabled={categorizedSlots.evening.length === 0}
            onClick={() => setActiveTab('evening')}
            className={`flex items-center justify-center gap-1 flex-1 py-1.5 px-2 rounded-xl text-[10px] font-black transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed ${
              activeTab === 'evening'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 shadow-md shadow-amber-950/40'
                : 'text-stone-400 hover:text-amber-300'
            }`}
          >
            <Sunset size={11} /> Evening
          </button>
        </div>
      )}

      {/* Сетка слотов */}
      {visibleSlots.length > 0 ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 max-h-48 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-stone-800">
          {visibleSlots.map((slot, index) => {
            const isSelected = selectedSlot?.timeLabel === slot.timeLabel;
            const isDisabled = slot.isDisabled || slot.isBooked || slot.isPast;

            // Определяем текст причины
            let reasonText = slot.reason;
            if (!reasonText) {
              if (slot.isBooked) reasonText = 'Booked';
              else if (slot.isPast) reasonText = 'Past';
            }

            return (
              <button
                key={slot.timeLabel || index}
                type="button"
                disabled={isDisabled}
                onClick={() => onSelectSlot(slot)}
                className={`relative group h-12 px-2 rounded-2xl text-center border transition-all duration-200 flex flex-col items-center justify-center font-black ${
                  isDisabled
                    ? 'bg-stone-800/40 border-stone-800/60 text-stone-600 cursor-not-allowed opacity-60'
                    : isSelected
                    ? 'bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-500 border-amber-300 text-stone-950 shadow-lg shadow-amber-500/20 scale-[1.03] z-10'
                    : 'bg-stone-800/80 border-stone-700/80 text-stone-100 hover:border-amber-500/60 hover:bg-stone-800 active:scale-95'
                }`}
              >
                {/* Метка "Selected" (Галочка) */}
                {isSelected && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-stone-950 text-amber-400 rounded-full flex items-center justify-center shadow-md border border-amber-400">
                    <Check size={10} strokeWidth={3} />
                  </span>
                )}

                {/* Время слота */}
                <span className={`text-xs tracking-tight ${isDisabled ? 'line-through text-stone-500' : ''}`}>
                  {slot.timeLabel}
                </span>

                {/* Причина недоступности (BOOKED / PAST / REASON) */}
                {isDisabled && reasonText && (
                  <span className={`text-[8px] font-extrabold uppercase tracking-tighter -mt-0.5 ${
                    slot.isBooked || reasonText.toLowerCase() === 'booked' ? 'text-rose-400/90' : 'text-stone-500'
                  }`}>
                    {reasonText}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      ) : (
        /* Empty state (если на этот день вообще нет слотов) */
        <div className="flex flex-col items-center justify-center py-7 px-4 rounded-2xl bg-stone-800/40 border border-dashed border-stone-700/80 text-center">
          <div className="w-10 h-10 rounded-full bg-stone-800 flex items-center justify-center text-amber-400/80 mb-2 border border-stone-700">
            <AlertCircle size={20} />
          </div>
          <p className="text-xs font-black text-stone-200">No slots available</p>
          <p className="text-[11px] text-stone-400 font-medium mt-0.5 max-w-[200px]">
            Please choose another date or check back later.
          </p>
        </div>
      )}
    </div>
  );
}