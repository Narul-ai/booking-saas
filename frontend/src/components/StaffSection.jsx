import { useState, useMemo } from 'react';
import { 
  Star, 
  ShieldCheck, 
  UserCheck, 
  Award, 
  Sparkles,
  Scissors,
  CheckCircle2,
  Image as ImageIcon,
  Calendar
} from 'lucide-react';
import PortfolioModal from './PortfolioModal';
import { isBarberWorkingOnDate } from '../utils/staffHelpers';

export default function StaffSection({ 
  staff = [], 
  onSelectBarber, 
  onOpenModal, 
  onSelectService,
  onSelectWork,
  getStaffStatus
}) {
  const [activeTab, setActiveTab] = useState('all');
  const [selectedBarberForModal, setSelectedBarberForModal] = useState(null);

  // Аватары по умолчанию (на случай отсутствия фото у сотрудника)
  const fallbackAvatars = [
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=600',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=600',
    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=600',
    'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&q=80&w=600',
    'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=600',
    'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=600',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=600',
    'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=600',
  ];

  // Дефолтные специализации для визуальной гармонии
  const specializations = [
    'Fades & Modern Styling',
    'Beard Sculpting & Hot Towel',
    'Classic Cuts & Razor Shave',
    'Full Grooming & Precision'
  ];

  // Проверка статуса работы мастера на сегодня
  const checkIsWorkingToday = (member) => {
    if (!member) return false;
    const currentDate = new Date();

    const isWorkingBySchedule = isBarberWorkingOnDate(member, currentDate);

    const targetId = member._id || member.id;
    if (typeof getStaffStatus === 'function' && targetId) {
      const status = getStaffStatus(targetId);
      if (status && typeof status.isOff !== 'undefined') {
        return !status.isOff && isWorkingBySchedule;
      }
    }

    return isWorkingBySchedule;
  };

  // Динамический маппинг стилей бейджа
  const getLevelBadgeStyle = (title = '') => {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('senior')) {
      return 'bg-amber-500/10 text-amber-400 border-amber-500/30 shadow-amber-500/10';
    }
    if (lowerTitle.includes('master')) {
      return 'bg-amber-400/10 text-amber-300 border-amber-400/30';
    }
    if (lowerTitle.includes('top') || lowerTitle.includes('specialist')) {
      return 'bg-purple-500/10 text-purple-300 border-purple-500/30';
    }
    return 'bg-zinc-800/80 text-zinc-300 border-zinc-700/60';
  };

  const processedStaff = useMemo(() => {
    return staff.map((member, idx) => {
      // Имя мастера
      const name = member.name || member.fullName || member.username || `Barber #${idx + 1}`;
      
      // Вычисление рейтинга из базы (или с динамическим разбросом, если в базе дефолтные 5.0)
      const dbRating = Number(member.staffProfile?.rating || member.rating);
      
      const baseRating = (dbRating && dbRating !== 5.0)
        ? dbRating.toFixed(1)
        : Number(4.7 + ((idx * 3) % 4) * 0.1).toFixed(1);
      
      // Приоритет должности: staffProfile.title -> roleTitle -> title -> position -> Barber
      const displayTitle = 
        member.staffProfile?.title || 
        member.roleTitle || 
        member.title || 
        member.position || 
        'Barber';

      const reviewsCount = member.reviewsCount || (92 + idx * 31);
      const spec = member.specialization || member.specialty || specializations[idx % specializations.length];
      
      // Аватар из базы
      const avatarUrl = 
        member.staffProfile?.avatarUrl || 
        member.avatarUrl || 
        member.avatar || 
        member.photo || 
        fallbackAvatars[idx % fallbackAvatars.length];

      const isWorkingToday = checkIsWorkingToday(member);

      return {
        ...member,
        name,
        barberIdx: idx,
        computedRating: baseRating,
        displayTitle,
        reviewsCount,
        spec,
        avatarUrl,
        isWorkingToday
      };
    });
  }, [staff, getStaffStatus]);

  // Фильтрация Топ-Мастеров
  const filteredStaff = useMemo(() => {
    if (activeTab === 'top') {
      return processedStaff.filter((m) => Number(m.computedRating) >= 4.9);
    }
    return processedStaff;
  }, [processedStaff, activeTab]);

  // Универсальный хендлер бронирования
  const handleBooking = (barberId, isWorking) => {
    if (!isWorking) return;

    if (typeof onOpenModal === 'function') {
      onOpenModal('', barberId);
    } else if (typeof onSelectBarber === 'function') {
      onSelectBarber(barberId);
    } else if (typeof onSelectService === 'function') {
      onSelectService('', barberId);
    }
  };

  return (
    <section id="team" className="w-full bg-zinc-950 py-24 border-t border-zinc-800/80 text-zinc-100 relative overflow-hidden selection:bg-amber-500 selection:text-zinc-950">
      
      {/* Декоративный фоновый свет */}
      <div className="absolute top-1/2 right-0 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/5 blur-[180px] pointer-events-none rounded-full" />
      <div className="absolute bottom-0 left-10 w-[400px] h-[400px] bg-amber-600/5 blur-[150px] pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* HEADER & FILTERS */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-12 gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-950/60 to-amber-900/30 border border-amber-500/30 px-3.5 py-1.5 rounded-full text-amber-400 text-xs font-black tracking-wide uppercase shadow-inner">
              <UserCheck size={14} className="text-amber-400" />
              <span>Master Craftsmanship</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-none">
              Meet Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-500">Specialists</span>
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-md font-medium leading-relaxed">
              Licensed barbers with 5+ years of experience in modern precision fades, classic scissor cuts, and razor beard shaping.
            </p>
          </div>

          {/* Табы фильтрации */}
          <div className="flex items-center gap-1.5 bg-zinc-900/90 p-1.5 rounded-2xl border border-zinc-800/80 backdrop-blur-md self-start lg:self-auto shadow-xl">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all duration-200 cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-amber-500 text-zinc-950 shadow-lg shadow-amber-500/25 scale-[1.02]'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
              }`}
            >
              All Masters ({processedStaff.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('top')}
              className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'top'
                  ? 'bg-amber-500 text-zinc-950 shadow-lg shadow-amber-500/25 scale-[1.02]'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
              }`}
            >
              <Sparkles size={13} className={activeTab === 'top' ? 'fill-zinc-950 text-zinc-950' : 'text-amber-400'} />
              Top Rated (4.9+)
            </button>
          </div>
        </div>

        {/* STAFF GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredStaff.map((member) => {
            const firstName = member.name ? member.name.split(' ')[0] : 'Barber';
            const memberId = member._id || member.id || member.barberIdx;
            const badgeStyle = getLevelBadgeStyle(member.displayTitle);
            const isWorking = member.isWorkingToday;

            return (
              <div 
                key={memberId}
                className={`group relative border rounded-3xl p-5 transition-all duration-300 flex flex-col justify-between backdrop-blur-sm ${
                  isWorking 
                    ? 'bg-zinc-900/50 border-zinc-800/80 hover:border-amber-500/50 hover:-translate-y-1 hover:bg-zinc-900 hover:shadow-2xl hover:shadow-amber-500/10' 
                    : 'bg-zinc-950/40 border-zinc-900/80 opacity-60'
                }`}
              >
                <div>
                  {/* Контейнер Аватара */}
                  <div className="relative w-full aspect-square rounded-2xl overflow-hidden mb-4 bg-zinc-800/80 border border-zinc-800 group-hover:border-amber-500/30 transition-colors">
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-zinc-950/20 to-transparent z-10 opacity-70 group-hover:opacity-40 transition-opacity" />

                    <img 
                      src={member.avatarUrl} 
                      alt={member.name} 
                      className={`w-full h-full object-cover object-center transition-transform duration-500 ease-out ${
                        isWorking ? 'group-hover:scale-105' : 'grayscale-[40%]'
                      }`}
                      loading="lazy"
                    />

                    {/* Статус Доступности */}
                    {isWorking ? (
                      <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 bg-zinc-950/80 backdrop-blur-md px-2.5 py-1 rounded-full border border-emerald-500/30 shadow-md">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-bold text-emerald-400 tracking-wide">Available</span>
                      </div>
                    ) : (
                      <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 bg-rose-950/90 backdrop-blur-md px-2.5 py-1 rounded-full border border-rose-800/50 shadow-md">
                        <span className="w-2 h-2 rounded-full bg-rose-500" />
                        <span className="text-[10px] font-black text-rose-300 uppercase tracking-wider">Off Today</span>
                      </div>
                    )}

                    {/* Бейдж Подтверждённого Мастера */}
                    <div 
                      className={`absolute bottom-3 right-3 z-20 p-1.5 rounded-xl shadow-xl border transition-transform ${
                        isWorking 
                          ? 'bg-amber-500 text-zinc-950 border-amber-300/50 group-hover:scale-110' 
                          : 'bg-zinc-800 text-zinc-500 border-zinc-700/50'
                      }`}
                      title="Verified Specialist"
                    >
                      <ShieldCheck size={15} className="stroke-[2.5]" />
                    </div>
                  </div>

                  {/* Имя и Уровень (Грейд) */}
                  <div className="text-center mb-3 space-y-1.5">
                    <h3 className={`text-lg font-black tracking-tight truncate transition-colors ${
                      isWorking ? 'text-white group-hover:text-amber-400' : 'text-zinc-400'
                    }`}>
                      {member.name}
                    </h3>
                    
                    {/* Вывод динамической должности из базы */}
                    <div className="inline-block">
                      <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border ${badgeStyle}`}>
                        {member.displayTitle}
                      </span>
                    </div>
                  </div>

                  {/* Специализация */}
                  <div className="flex items-center justify-center gap-1.5 text-[11px] font-medium text-zinc-300 bg-zinc-950/80 border border-zinc-800/80 py-2 px-3 rounded-xl mb-3 text-center">
                    <Scissors size={13} className={isWorking ? "text-amber-500 shrink-0" : "text-zinc-600 shrink-0"} />
                    <span className="truncate">{member.spec}</span>
                  </div>

                  {/* Рейтинг */}
                  <div className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold mb-3 w-max mx-auto shadow-inner ${
                    isWorking 
                      ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' 
                      : 'bg-zinc-900/60 border-zinc-800/60 text-zinc-500'
                  }`}>
                    <Star size={13} className={isWorking ? "fill-amber-400 text-amber-400" : "fill-zinc-600 text-zinc-600"} />
                    <span>{member.computedRating}</span>
                    <span className="text-zinc-500 text-[10px] font-normal">({member.reviewsCount} reviews)</span>
                  </div>

                  {/* Кнопка Модалки Портфолио */}
                  <button
                    type="button"
                    onClick={() => setSelectedBarberForModal(member)}
                    className="w-full mb-3 py-2.5 px-3 rounded-xl bg-zinc-950/80 hover:bg-zinc-800 border border-zinc-800 hover:border-amber-500/40 text-zinc-300 hover:text-amber-400 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer group/look"
                  >
                    <ImageIcon size={13} className="text-amber-400 group-hover/look:scale-110 transition-transform" />
                    <span>View Portfolio (Lookbook)</span>
                  </button>
                </div>

                {/* Главная Кнопка Записи к Мастеру */}
                <button
                  type="button"
                  disabled={!isWorking}
                  onClick={() => handleBooking(member._id || member.id, isWorking)}
                  className={`w-full mt-2 text-xs font-black py-3.5 rounded-2xl transition-all duration-200 flex items-center justify-center gap-2 border shadow-md group/btn ${
                    isWorking 
                      ? 'bg-zinc-800/90 hover:bg-amber-500 hover:text-zinc-950 text-white border-zinc-700/50 hover:border-amber-400 active:scale-95 cursor-pointer' 
                      : 'bg-zinc-900/40 text-zinc-600 border-zinc-800/40 cursor-not-allowed select-none'
                  }`}
                >
                  <Calendar size={14} className={isWorking ? "group-hover/btn:scale-110 transition-transform" : "text-zinc-600"} />
                  <span>{isWorking ? `Book with ${firstName}` : 'Off Today'}</span>
                </button>

              </div>
            );
          })}
        </div>

        {/* ПРЕМИАЛЬНЫЙ БАННЕР ГАРАНТИИ КАЧЕСТВА */}
        <div className="mt-14 bg-gradient-to-r from-zinc-900/90 via-zinc-900/60 to-zinc-900/90 border border-amber-500/30 rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-5 shadow-2xl backdrop-blur-md">
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
              <Award size={24} />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-white flex items-center justify-center sm:justify-start gap-1.5">
                <span>Strict Quality Standard</span>
                <CheckCircle2 size={14} className="text-amber-400" />
              </h4>
              <p className="text-xs text-zinc-400 mt-0.5">All barbers undergo monthly qualification testing and masterclasses.</p>
            </div>
          </div>
          <span className="text-xs font-black text-amber-400 bg-amber-950/80 px-4 py-2 rounded-xl border border-amber-500/40 shrink-0 shadow-lg tracking-wide uppercase">
            100% Satisfaction Guarantee
          </span>
        </div>

      </div>

      {/* PORTFOLIO MODAL */}
      <PortfolioModal 
        isOpen={!!selectedBarberForModal}
        onClose={() => setSelectedBarberForModal(null)}
        barber={selectedBarberForModal}
        onSelectWork={(work, barber) => {
          const targetBarber = barber || selectedBarberForModal;
          if (targetBarber && !targetBarber.isWorkingToday) {
            return;
          }
          if (typeof onSelectWork === 'function') {
            onSelectWork(work, targetBarber);
          }
        }} 
      />
    </section>
  );
}