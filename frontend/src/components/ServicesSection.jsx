import { useState, useMemo } from 'react';
import { 
  Clock, 
  Sparkles, 
  CheckCircle2, 
  Search, 
  ArrowRight, 
  Scissors, 
  Tag,
  X,
  Zap,
  Sparkle,
  Smile,
  Boxes
} from 'lucide-react';

export default function ServicesSection({ services = [], onSelectService }) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // 1. ТОЧНЫЕ КАТЕГОРИИ (как на бэкенде)
  const categories = [
    { id: 'all', label: 'All Services', icon: Scissors },
    { id: 'haircut', label: 'Haircut', icon: Scissors },
    { id: 'beard', label: 'Beard & Shaving', icon: Zap },
    { id: 'combo', label: 'Combo Package', icon: Sparkles },
    { id: 'facial', label: 'Facial & Care', icon: Smile },
    { id: 'other', label: 'Other', icon: Boxes },
  ];

  // Генератор описание-заглушки для максимальной красоты UI
  const getDescription = (title = '', category = '') => {
    const t = title.toLowerCase();
    const c = String(category).toLowerCase();

    if (c === 'haircut' || t.includes('haircut') || t.includes('cut')) 
      return 'Precision cut tailored to your head shape, including scalp massage, wash, and luxury finish.';
    if (c === 'beard' || t.includes('beard') || t.includes('shave')) 
      return 'Hot towel beard sculpting, razor edging, and deep essential oil conditioning treatment.';
    if (c === 'combo' || t.includes('combo') || t.includes('package')) 
      return 'Ultimate signature experience combining classic haircut, full beard detailing, and facial revival.';
    if (c === 'facial' || t.includes('facial') || t.includes('care') || t.includes('black mask')) 
      return 'Deep pore cleansing, blackhead extraction, hydrating skin mask, and cold towel refresh.';
    
    return 'Premium grooming service delivered by master barbers using top-tier professional products.';
  };

  // 2. УМНАЯ ФИЛЬТРАЦИЯ
  const filteredServices = useMemo(() => {
    return services.filter((service) => {
      const title = (service.title || service.name || '').toLowerCase();
      const desc = (service.description || '').toLowerCase();
      const category = (service.category || '').toLowerCase();
      const query = searchQuery.toLowerCase().trim();

      // Поиск по названию или описанию
      const matchesSearch = !query || title.includes(query) || desc.includes(query);
      if (!matchesSearch) return false;

      // Фильтр по категории
      if (activeCategory === 'all') return true;

      // Точный маппинг по полю category или поиск по ключам в названии
      if (category === activeCategory) return true;

      if (activeCategory === 'haircut') return title.includes('haircut') || title.includes('cut') || title.includes('fade');
      if (activeCategory === 'beard') return title.includes('beard') || title.includes('shave') || title.includes('trim');
      if (activeCategory === 'combo') return title.includes('combo') || title.includes('package') || title.includes('father');
      if (activeCategory === 'facial') return title.includes('facial') || title.includes('mask') || title.includes('scrub') || title.includes('care');
      if (activeCategory === 'other') return !['haircut', 'beard', 'combo', 'facial'].some(k => title.includes(k) || category.includes(k));

      return true;
    });
  }, [services, activeCategory, searchQuery]);

  return (
    <section id="services" className="w-full bg-zinc-950 py-24 border-t border-zinc-800/80 text-zinc-100 relative overflow-hidden">
      
      {/* Декоративные фоновые свечения (Bronze / Gold ambient) */}
      <div className="absolute top-1/4 -left-48 w-[600px] h-[600px] bg-amber-600/10 blur-[180px] pointer-events-none rounded-full" />
      <div className="absolute bottom-1/4 -right-48 w-[500px] h-[500px] bg-amber-500/5 blur-[160px] pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* 1. ХЕДЕР СЕКЦИИ */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-12 gap-8">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-950/60 to-amber-900/30 border border-amber-500/30 px-4 py-1.5 rounded-full text-amber-400 text-xs font-bold tracking-wide shadow-inner">
              <Scissors size={14} className="text-amber-400 animate-pulse" />
              <span>PREMIUM SERVICE MENU</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-none">
              Crafted Grooming <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-600">Services</span>
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 font-medium leading-relaxed pt-1">
              Every appointment includes individual consultation, head wash, hot towel treatment, and complimentary bar refresh.
            </p>
          </div>

          {/* ПОИСК */}
          <div className="w-full lg:w-72 shrink-0">
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input 
                type="text"
                placeholder="Search services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-900/90 border border-zinc-800 rounded-2xl pl-10 pr-9 py-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/10 transition-all"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 2. ТАБЫ КАТЕГОРИЙ */}
        <div className="flex items-center gap-2.5 overflow-x-auto pb-4 mb-10 no-scrollbar scroll-smooth">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all duration-300 flex items-center gap-2 whitespace-nowrap border shrink-0 ${
                  isActive
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 border-amber-400 text-zinc-950 shadow-lg shadow-amber-500/20 scale-[1.02]'
                    : 'bg-zinc-900/80 border-zinc-800/80 text-zinc-400 hover:text-white hover:border-zinc-700 hover:bg-zinc-900'
                }`}
              >
                <Icon size={14} className={isActive ? 'text-zinc-950' : 'text-amber-500/80'} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* 3. СЕТКА КАРТОЧЕК */}
        {filteredServices.length === 0 ? (
          <div className="text-center py-20 bg-zinc-900/30 border border-zinc-800/80 rounded-3xl backdrop-blur-sm">
            <Tag size={40} className="mx-auto text-zinc-600 mb-4 opacity-50" />
            <h3 className="text-base font-bold text-white mb-1">No services found</h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto mb-6">
              We couldn't find anything matching "{searchQuery}". Try searching for another term or reset filters.
            </p>
            <button
              onClick={() => { setActiveCategory('all'); setSearchQuery(''); }}
              className="text-xs font-bold text-amber-400 hover:text-amber-300 bg-amber-500/10 border border-amber-500/20 px-4 py-2 rounded-xl transition-all"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((service, index) => {
              const title = service.title || service.name || 'Untitled Service';
              const price = service.price ?? 0;
              const duration = service.durationMinutes || service.duration || 45;
              const isPopular = service.popular || service.isPopular || index === 1 || title.toLowerCase().includes('combo');

              return (
                <div 
                  key={service._id || index} 
                  className={`relative rounded-3xl p-7 flex flex-col justify-between transition-all duration-300 group hover:-translate-y-1.5 ${
                    isPopular 
                      ? 'bg-gradient-to-b from-zinc-900 via-zinc-900 to-zinc-950 border-2 border-amber-500/80 shadow-2xl shadow-amber-500/10' 
                      : 'bg-zinc-900/60 border border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900/90'
                  }`}
                >
                  {/* Бейдж Best Choice / Most Popular */}
                  {isPopular && (
                    <div className="absolute -top-3.5 right-6 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-zinc-950 text-[10px] font-black uppercase tracking-wider px-3.5 py-1 rounded-full flex items-center gap-1 shadow-lg shadow-amber-500/30">
                      <Sparkle size={11} className="fill-zinc-950" /> Signature Package
                    </div>
                  )}

                  <div>
                    {/* Хедер карточки */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <h3 className="text-lg font-bold text-white group-hover:text-amber-400 transition-colors leading-snug">
                        {title}
                      </h3>
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-zinc-300 bg-zinc-800/90 border border-zinc-700/60 px-2.5 py-1 rounded-xl shrink-0 shadow-sm">
                        <Clock size={12} className="text-amber-400" />
                        {duration}m
                      </span>
                    </div>

                    {/* Описание */}
                    <p className="text-xs text-zinc-400 leading-relaxed mb-6 font-medium line-clamp-3">
                      {service.description || getDescription(title, service.category)}
                    </p>

                    {/* Преимущества услуги */}
                    <div className="space-y-2 mb-8 pt-2 border-t border-zinc-800/50">
                      <div className="flex items-center gap-2 text-[11px] text-zinc-300 font-medium">
                        <CheckCircle2 size={13} className="text-amber-400 shrink-0" /> 
                        <span>Consultation & Styling Assessment</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-zinc-300 font-medium">
                        <CheckCircle2 size={13} className="text-amber-400 shrink-0" /> 
                        <span>Hot towel refresh & Premium finish</span>
                      </div>
                    </div>
                  </div>

                  {/* Футер карточки */}
                  <div className="pt-4 border-t border-zinc-800/80 flex items-center justify-between mt-auto">
                    <div>
                      <span className="text-[10px] uppercase font-extrabold text-zinc-500 block tracking-widest">Price</span>
                      <div className="flex items-baseline gap-0.5">
                        <span className="text-2xl font-black text-white tracking-tight">${price}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => onSelectService && onSelectService(service)}
                      className={`text-xs font-black px-5 py-3 rounded-2xl transition-all duration-200 active:scale-95 flex items-center gap-2 ${
                        isPopular 
                          ? 'bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-zinc-950 shadow-lg shadow-amber-500/25' 
                          : 'bg-zinc-800 hover:bg-amber-500 hover:text-zinc-950 text-white'
                      }`}
                    >
                      <span>Book Now</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>
    </section>
  );
}