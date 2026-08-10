// src/components/Hero.jsx
import { useState } from 'react';
import { 
  Scissors, 
  Calendar, 
  Clock, 
  Star, 
  ShieldCheck, 
  Coffee, 
  MapPin, 
  Phone, 
  Sparkles, 
  ArrowRight,
  UserCheck,
  CheckCircle2,
  Zap
} from 'lucide-react';
import { ALL_STAFF, getBarberFullName, isBarberWorkingOnDate } from '../utils/staffHelpers';

// Топ-3 мастера для карточки в Hero
const FEATURED_STAFF_DEFAULTS = [
  {
    _id: '1',
    name: 'Daniel Vance',
    role: 'TOP SPECIALIST',
    specialization: 'Beard Sculpting & Hot Towel',
    rating: '5.0',
    reviewsCount: 123
  },
  {
    _id: '2',
    name: 'David Miller',
    role: 'TOP SPECIALIST',
    specialization: 'Beard Sculpting & Hot Towel',
    rating: '5.0',
    reviewsCount: 247
  },
  {
    _id: '5',
    name: 'Marcus Hayes',
    role: 'SENIOR BARBER',
    specialization: 'Classic Cuts & Razor Shave',
    rating: '4.9',
    reviewsCount: 154
  }
];

export default function Hero({ onOpenBooking, onOpenModal, staff = [], getStaffStatus }) {
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Объединяем эталонных мастеров с динамическими данными из БД/пропсов
  const displayStaff = FEATURED_STAFF_DEFAULTS.map((defaultBarber) => {
    const realBarber = staff.find((s) => {
      const sId = String(s._id || s.id || '');
      const dId = String(defaultBarber._id);
      const sName = getBarberFullName(s).toLowerCase();
      const dName = defaultBarber.name.toLowerCase();
      
      return (sId && sId === dId) || (sName && sName === dName);
    });

    if (realBarber) {
      return {
        ...defaultBarber,
        ...realBarber,
        // Сохраняем приоритет красивых ролей и рейтингов, если из БД пришел абстрактный "STAFF"
        role: (realBarber.role && realBarber.role !== 'STAFF' && realBarber.role !== 'staff') 
          ? realBarber.role 
          : defaultBarber.role,
        specialization: realBarber.specialization || defaultBarber.specialization,
        rating: realBarber.rating || defaultBarber.rating,
        _id: realBarber._id || realBarber.id || defaultBarber._id
      };
    }

    return defaultBarber;
  });

  // Функция проверки работы мастера
  // ✅ НОВАЯ ВЕРСИЯ (с гарантированным фолбэком на isBarberWorkingOnDate)
const checkIsWorkingToday = (barber) => {
  if (!barber) return false;

  const currentDate = new Date();

  // 1. Проверяем напрямую через алгоритм графика дней недели (MongoDB / workingDays)
  const isWorkingBySchedule = isBarberWorkingOnDate(barber, currentDate);

  // 2. Если передана внешняя функция getStaffStatus, учитываем её, но не даем ей сбросить верный график
  const targetId = barber._id || barber.id;
  if (typeof getStaffStatus === 'function' && targetId) {
    const status = getStaffStatus(targetId);
    if (status && typeof status.isOff !== 'undefined') {
      // Если передана внешняя функция, мастер работает только если ОБА источника подтверждают
      return !status.isOff && isWorkingBySchedule;
    }
  }

  // 3. Главный источник правды — расписание мастера
  return isWorkingBySchedule;
};

  const handleBooking = (serviceName = '', staffMember = null, targetDate = null) => {
    if (staffMember && typeof staffMember === 'object') {
      if (!checkIsWorkingToday(staffMember)) {
        return;
      }
    }

    const staffId = typeof staffMember === 'object' && staffMember !== null 
      ? (staffMember._id || staffMember.id || '') 
      : String(staffMember || '');

    if (typeof onOpenBooking === 'function') {
      onOpenBooking(serviceName, staffId, targetDate);
    } else if (typeof onOpenModal === 'function') {
      onOpenModal(serviceName, staffId, targetDate);
    } else {
      console.warn('Booking modal function is not provided to Hero component.');
    }
  };

  const quickServices = ['Haircut', 'Beard & Shaving', 'Combo Package', 'Facial & Care'];

  return (
    <section className="relative overflow-hidden bg-zinc-950 text-zinc-100 py-16 sm:py-24 lg:py-28 border-b border-zinc-800/80 select-none">
      
      {/* Свечения на фоне */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[450px] bg-amber-500/10 blur-[160px] pointer-events-none rounded-full animate-pulse duration-1000" />
      <div className="absolute bottom-10 left-10 w-[350px] h-[350px] bg-indigo-500/5 blur-[120px] pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* ЛЕВАЯ ЧАСТЬ */}
          <div className="lg:col-span-7 text-center lg:text-left space-y-6">
            
            <div className="inline-flex flex-wrap items-center justify-center lg:justify-start gap-2">
              <div className="inline-flex items-center gap-2 bg-amber-950/50 border border-amber-500/30 px-3.5 py-1.5 rounded-full text-amber-400 text-xs font-bold shadow-inner backdrop-blur-md">
                <Sparkles size={13} className="text-amber-400 animate-pulse" />
                <span>Instant 24/7 Online Booking</span>
              </div>
              <div className="hidden sm:inline-flex items-center gap-1.5 bg-zinc-900/80 border border-zinc-800 px-3 py-1.5 rounded-full text-zinc-400 text-xs font-medium">
                <Zap size={12} className="text-amber-500" />
                <span>No Waiting Lines</span>
              </div>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.08]">
              Premium Grooming & <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-amber-200 via-amber-400 to-amber-600 bg-clip-text text-transparent">
                Style for Gentlemen
              </span>
            </h1>

            <p className="text-sm sm:text-base text-zinc-400 font-medium max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              Select your favorite barber, choose a convenient time slot, and confirm your appointment in under 60 seconds. Zero phone calls required.
            </p>

            {/* Быстрый выбор услуг */}
            <div className="pt-1 flex flex-wrap items-center justify-center lg:justify-start gap-2">
              <span className="text-xs font-bold text-zinc-500 mr-1">Popular:</span>
              {quickServices.map((service, idx) => (
                <button
                  key={idx}
                  onClick={() => handleBooking(service)}
                  className="text-xs bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 hover:text-amber-400 px-3 py-1.5 rounded-lg border border-zinc-800 hover:border-amber-500/40 transition-all cursor-pointer active:scale-95"
                >
                  {service}
                </button>
              ))}
            </div>

            {/* Кнопки */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-3">
              <button
                onClick={() => handleBooking()}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 bg-[length:200%_auto] hover:bg-right text-zinc-950 font-black text-sm shadow-xl shadow-amber-500/20 hover:shadow-amber-500/35 transition-all duration-500 active:scale-95 flex items-center justify-center gap-2.5 group cursor-pointer"
              >
                <Calendar size={18} />
                <span>Book Your Visit Now</span>
                <ArrowRight size={17} className="group-hover:translate-x-1 transition-transform" />
              </button>

              <a
                href="#services"
                className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 hover:text-white font-bold text-sm border border-zinc-800/90 hover:border-zinc-700 transition-all flex items-center justify-center gap-2.5"
              >
                <Scissors size={16} className="text-amber-500" />
                <span>View Services & Prices</span>
              </a>
            </div>

            {/* Отзывы */}
            <div className="pt-6 border-t border-zinc-900/90 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2.5 overflow-hidden">
                  <img src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=100" alt="Client" className="inline-block h-8 w-8 rounded-full ring-2 ring-zinc-950 object-cover" />
                  <img src="https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&q=80&w=100" alt="Client" className="inline-block h-8 w-8 rounded-full ring-2 ring-zinc-950 object-cover" />
                  <img src="https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=100" alt="Client" className="inline-block h-8 w-8 rounded-full ring-2 ring-zinc-950 object-cover" />
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={11} className="fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <span className="text-[11px] font-bold text-zinc-400 block mt-0.5">
                    1,200+ Gentlemen booked this month
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs text-zinc-400 font-medium">
                <span className="flex items-center gap-1.5"><ShieldCheck size={14} className="text-amber-500" /> Top Quality</span>
                <span className="flex items-center gap-1.5"><Coffee size={14} className="text-amber-500" /> Free Drink</span>
              </div>
            </div>

          </div>

          {/* ПРАВАЯ ЧАСТЬ */}
          <div className="lg:col-span-5">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              
              <div className="absolute -inset-0.5 rounded-3xl bg-gradient-to-tr from-amber-500 via-amber-600 to-indigo-600 opacity-25 blur-xl"></div>
              
              <div className="relative bg-zinc-900/95 border border-zinc-800/90 rounded-3xl p-6 sm:p-7 shadow-2xl backdrop-blur-2xl space-y-6">
                
                {/* Статус работы салона */}
                <div className="flex items-center justify-between pb-4 border-b border-zinc-800/80">
                  <div className="flex items-center gap-2.5">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </span>
                    <div>
                      <span className="text-xs font-black text-emerald-400 uppercase tracking-wider block">Open Today</span>
                      <span className="text-[10px] text-zinc-500 font-semibold block">09:00 AM – 09:00 PM</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl text-amber-400 text-xs font-extrabold shadow-sm">
                    <Star size={14} className="fill-amber-400" />
                    <span>4.95 / 5.0</span>
                  </div>
                </div>

                {/* Список мастеров */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-extrabold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                      <UserCheck size={14} className="text-amber-500" />
                      Featured Master Barbers:
                    </span>
                    <span className="text-[10px] text-zinc-500 font-medium">Select to book</span>
                  </div>

                  <div className="space-y-2.5">
                    {displayStaff.map((m) => {
                      const name = m.name || getBarberFullName(m);
                      const role = m.role;
                      const spec = m.specialization;
                      const rating = m.rating;
                      const isWorkingToday = checkIsWorkingToday(m);

                      return (
                        <div 
                          key={m._id || m.id || name} 
                          onClick={(e) => {
                            if (!isWorkingToday) {
                              e.preventDefault();
                              e.stopPropagation();
                              return;
                            }
                            handleBooking('', m, null);
                          }}
                          className={`group relative flex items-center justify-between p-3.5 rounded-2xl border transition-all duration-300 overflow-hidden shadow-sm ${
                            isWorkingToday 
                              ? 'bg-zinc-950/80 border-zinc-800/80 hover:border-amber-500/50 hover:bg-zinc-900/90 hover:translate-x-1 border-l-2 hover:border-l-amber-500 cursor-pointer' 
                              : 'bg-zinc-950/40 border-zinc-900/60 opacity-40 cursor-not-allowed select-none' 
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-11 h-11 rounded-xl font-black flex items-center justify-center text-xs border transition-all shrink-0 ${
                              isWorkingToday 
                                ? 'bg-gradient-to-br from-amber-500/20 via-zinc-900 to-amber-950 text-amber-400 border-amber-500/30 group-hover:border-amber-500/60 group-hover:ring-2 group-hover:ring-amber-500/20' 
                                : 'bg-zinc-900/60 text-zinc-600 border-zinc-800/40'
                            }`}>
                              {name.split(' ').map(n => n[0]).join('')}
                            </div>

                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1.5">
                                <span className={`text-xs font-bold transition-colors ${isWorkingToday ? 'text-white group-hover:text-amber-400' : 'text-zinc-500'}`}>
                                  {name}
                                </span>
                                {isWorkingToday ? (
                                  <CheckCircle2 size={13} className="text-amber-500 shrink-0" />
                                ) : (
                                  <span className="text-[9px] font-black bg-rose-950/80 text-rose-300 px-1.5 py-0.5 rounded border border-rose-800/40 uppercase tracking-wider">
                                    Off Today
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-1.5 text-[10px]">
                                <span className={`font-extrabold uppercase tracking-wider ${isWorkingToday ? 'text-amber-500' : 'text-zinc-600'}`}>
                                  {role}
                                </span>
                                <span className="text-zinc-600">•</span>
                                <span className="text-zinc-500 font-medium truncate max-w-[120px] sm:max-w-[150px]">
                                  {spec}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <div className={`inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-1 rounded-lg border mb-0.5 ${
                              isWorkingToday 
                                ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' 
                                : 'text-zinc-500 bg-zinc-900/40 border-zinc-800/50'
                            }`}>
                              <Star size={11} className={isWorkingToday ? "fill-amber-400" : "fill-zinc-600 text-zinc-600"} />
                              <span>{rating}</span>
                            </div>

                            {isWorkingToday && (
                              <span className="text-[10px] text-amber-400 font-bold block opacity-0 group-hover:opacity-100 transition-all transform translate-x-1 group-hover:translate-x-0">
                                Book →
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Адрес и контакты */}
                <div className="pt-2 grid grid-cols-2 gap-2 text-xs text-zinc-400 border-t border-zinc-800/60">
                  <div className="flex items-center gap-2 bg-zinc-950/50 p-2.5 rounded-xl border border-zinc-800/60 hover:border-zinc-700 transition-colors">
                    <MapPin size={15} className="text-amber-500 shrink-0" />
                    <span className="text-[11px] font-medium truncate">42 Central Avenue</span>
                  </div>
                  <div className="flex items-center gap-2 bg-zinc-950/50 p-2.5 rounded-xl border border-zinc-800/60 hover:border-zinc-700 transition-colors">
                    <Phone size={15} className="text-amber-500 shrink-0" />
                    <span className="text-[11px] font-medium truncate">+1 (555) 000-0000</span>
                  </div>
                </div>

                {/* Главная кнопка */}
                <button
                  onClick={() => handleBooking()}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:brightness-110 text-zinc-950 font-black text-xs transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-amber-500/15 active:scale-[0.98] cursor-pointer"
                >
                  <Clock size={15} />
                  <span>Check Available Time Slots</span>
                </button>

              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}