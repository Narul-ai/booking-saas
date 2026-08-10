import { Scissors, MapPin, Phone, Clock, ShieldCheck, ArrowUpRight } from 'lucide-react';

export default function Footer({ tenant }) {
  const currentYear = new Date().getFullYear();

  const scrollToSection = (e, id) => {
    e.preventDefault();
    let element = document.getElementById(id);
    if (!element && id === 'barbers') {
      element = document.getElementById('team');
    }
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="w-full bg-zinc-950 border-t border-zinc-800/80 text-zinc-400 relative overflow-hidden pt-10 pb-8 sm:pt-16 sm:pb-12 select-none">
      
      {/* Декоративное мягкое свечение заднего фона */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-amber-500/5 blur-3xl rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* ВЕРХНЯЯ ЧАСТЬ: СТРУКТУРА КОЛОНОК */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 pb-8 sm:pb-12 border-b border-zinc-800/80">
          
          {/* Колонка 1: Логотип и Бренд */}
          <div className="space-y-3.5 sm:space-y-4">
            <a href="#" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="inline-flex items-center gap-3 group max-w-full">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-amber-600 via-amber-500 to-amber-300 flex items-center justify-center font-black text-zinc-950 shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform duration-300 text-base sm:text-lg shrink-0">
                {tenant?.name ? tenant.name.charAt(0).toUpperCase() : 'T'}
              </div>
              <div className="min-w-0">
                <span className="font-black text-base sm:text-lg tracking-tight text-white block leading-tight group-hover:text-amber-400 transition-colors truncate">
                  {tenant?.name || 'TopGun Barbershop'}
                </span>
                <span className="text-[9px] sm:text-[10px] uppercase font-extrabold tracking-widest text-amber-500/90 block mt-0.5 flex items-center gap-1 truncate">
                  <Scissors size={10} className="inline group-hover:rotate-45 transition-transform duration-300 shrink-0" />
                  <span>Gentlemen Lounge</span>
                </span>
              </div>
            </a>

            <p className="text-xs text-zinc-400 leading-relaxed font-medium">
              A premium men's styling and haircut service. We preserve the traditions of classic barbering and create the atmosphere of a true gentlemen's club.
            </p>

            {/* Соцсети */}
            <div className="flex items-center gap-2 pt-1">
              {/* Instagram */}
              <a 
                href="https://instagram.com" 
                target="_blank" 
                rel="noreferrer"
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-amber-400 hover:border-amber-500/40 transition-all duration-200"
                aria-label="Instagram"
              >
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>

              {/* Telegram */}
              <a 
                href="https://t.me" 
                target="_blank" 
                rel="noreferrer"
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-amber-400 hover:border-amber-500/40 transition-all duration-200"
                aria-label="Telegram"
              >
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.121l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.128.832.941z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Колонка 2: Навигация */}
          <div className="space-y-3 sm:space-y-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-white">
              Navigation
            </h4>
            <ul className="space-y-2 text-xs font-semibold">
              <li>
                <a 
                  href="#services" 
                  onClick={(e) => scrollToSection(e, 'services')} 
                  className="hover:text-amber-400 transition-colors flex items-center gap-1.5 group"
                >
                  <ArrowUpRight size={13} className="text-zinc-600 group-hover:text-amber-400 transition-colors shrink-0" />
                  <span>Services & Prices</span>
                </a>
              </li>
              <li>
                <a 
                  href="#barbers" 
                  onClick={(e) => scrollToSection(e, 'barbers')} 
                  className="hover:text-amber-400 transition-colors flex items-center gap-1.5 group"
                >
                  <ArrowUpRight size={13} className="text-zinc-600 group-hover:text-amber-400 transition-colors shrink-0" />
                  <span>Barbers & Masters</span>
                </a>
              </li>
              <li>
                <a 
                  href="#about" 
                  onClick={(e) => scrollToSection(e, 'about')} 
                  className="hover:text-amber-400 transition-colors flex items-center gap-1.5 group"
                >
                  <ArrowUpRight size={13} className="text-zinc-600 group-hover:text-amber-400 transition-colors shrink-0" />
                  <span>About Lounge</span>
                </a>
              </li>
              <li>
                <a 
                  href="#contacts" 
                  onClick={(e) => scrollToSection(e, 'contacts')} 
                  className="hover:text-amber-400 transition-colors flex items-center gap-1.5 group"
                >
                  <ArrowUpRight size={13} className="text-zinc-600 group-hover:text-amber-400 transition-colors shrink-0" />
                  <span>Contacts & Location</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Колонка 3: Контакты и Часы работы */}
          <div className="space-y-3 sm:space-y-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-white">
              Working Hours
            </h4>
            <div className="space-y-2.5 text-xs font-medium">
              <div className="flex items-start gap-2.5">
                <Clock size={15} className="text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-white font-bold">Mon - Sun</p>
                  <p className="text-zinc-400 text-[11px] sm:text-xs">09:00 AM – 09:00 PM</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <MapPin size={15} className="text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-white font-bold">42 Central Avenue</p>
                  <p className="text-zinc-400 text-[11px] sm:text-xs">Downtown Lounge District</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 pt-0.5">
                <Phone size={15} className="text-amber-400 shrink-0" />
                <span className="text-white font-bold text-xs">+1 (555) 000-0000</span>
              </div>
            </div>
          </div>

          {/* Колонка 4: Качество и VIP Клуб */}
          <div className="space-y-3 sm:space-y-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-white">
              Gentlemen Standard
            </h4>
            
            <div className="p-3.5 sm:p-4 rounded-2xl bg-zinc-900/70 border border-zinc-800/90 space-y-1.5">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                <ShieldCheck size={15} className="shrink-0" />
                <span>100% Quality Guaranteed</span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-snug">
                Every visit includes an initial consultation, premium care, and coffee.
              </p>
            </div>

            <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">
              ✦ Online Booking Available 24/7
            </p>
          </div>

        </div>

        {/* НИЖНЯЯ ЧАСТЬ: Копирайт */}
        <div className="pt-6 sm:pt-8 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 text-xs font-medium text-zinc-500 text-center sm:text-left">
          <p>© {currentYear} {tenant?.name || 'TopGun Barbershop'}. All rights reserved.</p>
          
          <div className="flex items-center gap-4 sm:gap-6 text-[11px]">
            <a href="#" className="hover:text-zinc-300 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-zinc-300 transition-colors">Terms of Service</a>
          </div>
        </div>

      </div>
    </footer>
  );
}