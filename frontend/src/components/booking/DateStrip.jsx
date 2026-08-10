import { useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Zap, Sparkles } from 'lucide-react';

export default function DateStrip({ 
  datePills = [], 
  selectedDateStr, 
  onSelectDate, 
  onQuickEarliest 
}) {
  const dateListRef = useRef(null);
  const dateInputRef = useRef(null);
  const selectedPillRef = useRef(null);

  // 1. Автоматический скролл к выбранной дате (как в iOS/Airbnb)
  useEffect(() => {
    if (selectedPillRef.current && dateListRef.current) {
      const container = dateListRef.current;
      const pill = selectedPillRef.current;

      const containerWidth = container.offsetWidth;
      const pillOffsetLeft = pill.offsetLeft;
      const pillWidth = pill.offsetWidth;

      // Центрируем выбранную карточку
      const scrollPosition = pillOffsetLeft - containerWidth / 2 + pillWidth / 2;
      container.scrollTo({ left: scrollPosition, behavior: 'smooth' });
    }
  }, [selectedDateStr]);

  const handleScroll = (direction) => {
    if (dateListRef.current) {
      const scrollAmount = direction === 'left' ? -280 : 280;
      dateListRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="select-none">
      {/* Шапка блока */}
      <div className="flex items-center justify-between mb-2.5">
        <label className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
          <CalendarIcon size={13} className="text-indigo-500" /> 
          <span>Date</span>
        </label>

        <div className="flex items-center gap-1.5">
          {/* Кнопка Ближайшего слота */}
          <button
            type="button"
            onClick={onQuickEarliest}
            className="group relative inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-50 hover:bg-indigo-100/80 border border-indigo-100 text-indigo-600 text-[11px] font-bold transition-all duration-200 active:scale-95"
          >
            <Zap size={11} className="fill-indigo-600 group-hover:animate-bounce" />
            <span>Earliest</span>
          </button>

          {/* Стрелки навигации */}
          <div className="hidden sm:flex items-center gap-0.5 bg-slate-100/80 p-0.5 rounded-xl border border-slate-200/60">
            <button
              type="button"
              onClick={() => handleScroll('left')}
              className="w-6 h-6 rounded-lg hover:bg-white text-slate-500 hover:text-slate-900 flex items-center justify-center transition-all active:scale-90"
              title="Previous"
            >
              <ChevronLeft size={13} />
            </button>
            <button
              type="button"
              onClick={() => handleScroll('right')}
              className="w-6 h-6 rounded-lg hover:bg-white text-slate-500 hover:text-slate-900 flex items-center justify-center transition-all active:scale-90"
              title="Next"
            >
              <ChevronRight size={13} />
            </button>
          </div>

          {/* Календарь */}
          <div className="relative">
            <button
              type="button"
              onClick={() => dateInputRef.current?.showPicker()}
              className="w-7 h-7 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-600 flex items-center justify-center transition-all border border-slate-200/60 active:scale-95"
              title="Pick specific date"
            >
              <CalendarIcon size={13} />
            </button>
            <input
              ref={dateInputRef}
              type="date"
              min={new Date().toISOString().split('T')[0]}
              value={selectedDateStr}
              onChange={(e) => e.target.value && onSelectDate(e.target.value)}
              className="absolute opacity-0 pointer-events-none inset-0 w-full h-full"
            />
          </div>
        </div>
      </div>

      {/* Горизонтальный скролл дат */}
      <div className="relative group">
        {/* Градиентные тени по бокам для эффекта глуши / бесконечности */}
        <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />

        <div 
          ref={dateListRef}
          className="flex items-center gap-2 overflow-x-auto py-1 px-0.5 scrollbar-none scroll-smooth snap-x snap-mandatory"
        >
          {datePills.map((p) => {
            const isSelected = p.isoDate === selectedDateStr;
            const isToday = p.dayName === 'Today';

            return (
              <button
                key={p.isoDate}
                ref={isSelected ? selectedPillRef : null}
                type="button"
                onClick={() => onSelectDate(p.isoDate)}
                className={`snap-center flex-shrink-0 relative flex flex-col items-center justify-between py-2.5 px-3 rounded-2xl border transition-all duration-200 min-w-[66px] h-[72px] active:scale-95 ${
                  isSelected
                    ? 'bg-slate-900 border-slate-900 text-white shadow-lg shadow-slate-900/20 ring-2 ring-slate-900/10'
                    : 'bg-slate-50/70 border-slate-200/80 text-slate-700 hover:bg-slate-100/80 hover:border-slate-300'
                }`}
              >
                {/* Индикатор "Today" */}
                {isToday && (
                  <span className={`absolute -top-1 px-1.5 py-[1px] rounded-full text-[8px] font-black uppercase tracking-wider ${
                    isSelected ? 'bg-indigo-500 text-white' : 'bg-indigo-100 text-indigo-700'
                  }`}>
                    Today
                  </span>
                )}

                <span className={`text-[10px] font-extrabold uppercase tracking-wider ${
                  isSelected ? 'text-indigo-300' : 'text-slate-400'
                }`}>
                  {p.dayName}
                </span>

                <span className="text-base font-black leading-none my-auto tracking-tight">
                  {p.dayNumber}
                </span>

                <span className={`text-[9px] font-bold ${
                  isSelected ? 'text-slate-300' : 'text-slate-400'
                }`}>
                  {p.monthName}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}