import { useState, useEffect } from 'react';
import { 
  Calendar, 
  Shield, 
  User, 
  LogOut, 
  LogIn, 
  Menu, 
  X, 
  Scissors,
  Sparkles,
  Clock,
  BookmarkCheck
} from 'lucide-react';
import ClientProfile from './ClientProfile';

export default function Header({ 
  tenant, 
  onOpenModal, 
  isAdmin, 
  setIsAdmin, 
  user, 
  onAuthClick, 
  onLogout,
  onOpenRescheduleModal
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isBookingsOpen, setIsBookingsOpen] = useState(false);

  const handleOpenBooking = () => {
    if (typeof onOpenModal === 'function') {
      onOpenModal();
    }
    setMobileMenuOpen(false);
  };

  const scrollToSection = (e, sectionId) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    
    let element = document.getElementById(sectionId);
    if (!element && sectionId === 'barbers') {
      element = document.getElementById('team');
    }

    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleOpenMyBookings = () => {
    setIsBookingsOpen(true);
    setMobileMenuOpen(false);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
        setIsBookingsOpen(false);
      }
    };
    const handleResize = () => {
      if (window.innerWidth >= 1024) setMobileMenuOpen(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const userInitial = user?.name 
    ? user.name.charAt(0).toUpperCase() 
    : user?.email 
    ? user.email.charAt(0).toUpperCase() 
    : 'U';

  return (
    <>
      <header className="w-full border-b border-zinc-800/80 bg-zinc-950/85 backdrop-blur-xl sticky top-0 z-50 transition-all select-none">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-2 sm:gap-4 overflow-hidden">
          
          {/* 1. LOGO & BRAND NAME */}
          <div className="flex items-center gap-2 sm:gap-4 min-w-0 shrink">
            <a 
              href="#" 
              onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }} 
              className="flex items-center gap-2 sm:gap-3 group relative min-w-0"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 to-amber-600 rounded-2xl blur-md opacity-20 group-hover:opacity-60 transition duration-300"></div>
              
              {/* Иконка логотипа */}
              <div className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-amber-600 via-amber-500 to-amber-300 flex items-center justify-center font-black text-zinc-950 shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform duration-300 text-sm sm:text-lg shrink-0">
                T
              </div>
              
              {/* Текст логотипа */}
              <div className="flex flex-col justify-center min-w-0 overflow-hidden">
                <span className="font-black text-xs xs:text-sm sm:text-lg tracking-tight text-white block leading-tight group-hover:text-amber-400 transition-colors truncate">
                  TopGun Barbershop
                </span>
                <span className="text-[8px] sm:text-[10px] uppercase font-extrabold tracking-widest text-amber-500/90 mt-0.5 flex items-center gap-1 truncate">
                  <Scissors size={10} className="inline group-hover:rotate-45 transition-transform duration-300 shrink-0 hidden xs:inline" />
                  <span className="truncate">Gentlemen Lounge</span>
                </span>
              </div>
            </a>

            {/* Часы работы — только на огромных экранах */}
            <div className="hidden 2xl:flex items-center gap-2.5 pl-6 border-l border-zinc-800/80 shrink-0">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <div className="flex items-center gap-1 text-xs font-bold text-zinc-400 whitespace-nowrap">
                <Clock size={12} className="text-zinc-500" />
                <span>Open Today • 9:00 - 21:00</span>
              </div>
            </div>
          </div>

          {/* 2. NAVIGATION (Desktop) */}
          {!isAdmin && (
            <nav className="hidden lg:flex items-center gap-6 xl:gap-8 text-xs font-bold text-zinc-400 shrink-0">
              <a 
                href="#services" 
                onClick={(e) => scrollToSection(e, 'services')} 
                className="hover:text-amber-400 transition-colors duration-200 whitespace-nowrap"
              >
                Services & Prices
              </a>
              <a 
                href="#barbers" 
                onClick={(e) => scrollToSection(e, 'barbers')} 
                className="hover:text-amber-400 transition-colors duration-200 whitespace-nowrap"
              >
                Barbers
              </a>
              <a 
                href="#about" 
                onClick={(e) => scrollToSection(e, 'about')} 
                className="hover:text-amber-400 transition-colors duration-200 whitespace-nowrap"
              >
                About Us
              </a>
              <a 
                href="#contacts" 
                onClick={(e) => scrollToSection(e, 'contacts')} 
                className="hover:text-amber-400 transition-colors duration-200 whitespace-nowrap"
              >
                Contacts
              </a>
            </nav>
          )}

          {/* 3. ACTIONS & PROFILE */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">

            {user?.role === 'admin' && (
              <button 
                onClick={() => setIsAdmin(!isAdmin)}
                className={`hidden md:flex text-xs font-extrabold px-3.5 py-2.5 rounded-xl border transition-all duration-200 items-center gap-1.5 cursor-pointer active:scale-95 whitespace-nowrap ${
                  isAdmin 
                    ? 'bg-amber-500/10 border-amber-500/40 text-amber-400 shadow-sm shadow-amber-500/10 hover:bg-amber-500/20' 
                    : 'bg-zinc-900 border-zinc-800 hover:border-amber-500/30 text-zinc-300 hover:text-white'
                }`}
              >
                {isAdmin ? (
                  <>
                    <User size={14} className="text-amber-400 shrink-0" />
                    <span>Client View</span>
                  </>
                ) : (
                  <>
                    <Shield size={14} className="text-amber-500 shrink-0" />
                    <span>Admin Panel</span>
                  </>
                )}
              </button>
            )}

            {!isAdmin && (
              <button 
                onClick={handleOpenBooking}
                className="bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-black px-2.5 xs:px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl shadow-lg shadow-amber-500/20 hover:shadow-amber-500/35 transition-all duration-200 active:scale-95 flex items-center gap-1.5 cursor-pointer group whitespace-nowrap"
              >
                <Calendar size={14} className="stroke-[2.5] group-hover:scale-110 transition-transform duration-200 shrink-0" />
                <span className="text-[11px] xs:text-xs">Book Now</span>
              </button>
            )}

            {user ? (
              <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-zinc-800/80">
                <button 
                  title="Open My Bookings & Profile" 
                  className="flex items-center gap-2 bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 p-1.5 pr-3 rounded-xl cursor-pointer hover:border-amber-500/40 transition-all duration-200 active:scale-95"
                  onClick={handleOpenMyBookings}
                >
                  <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-black text-xs shrink-0">
                    {userInitial}
                  </div>
                  <span className="text-xs font-bold text-zinc-300 max-w-[90px] xl:max-w-[110px] truncate">
                    {user.name || 'Account'}
                  </span>
                </button>

                <button 
                  onClick={onLogout}
                  title="Sign Out"
                  className="p-2 sm:p-2.5 rounded-xl bg-zinc-900 hover:bg-rose-500/10 text-zinc-400 hover:text-rose-400 border border-zinc-800 hover:border-rose-500/30 transition-all duration-200 cursor-pointer active:scale-95 shrink-0"
                >
                  <LogOut size={15} />
                </button>
              </div>
            ) : (
              <button 
                onClick={onAuthClick}
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-bold border border-zinc-800 transition-all duration-200 cursor-pointer active:scale-95 whitespace-nowrap"
              >
                <LogIn size={14} className="text-amber-500 shrink-0" />
                <span>Sign In</span>
              </button>
            )}

            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle Navigation Menu"
              aria-expanded={mobileMenuOpen}
              className="lg:hidden p-2 sm:p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white active:scale-95 transition-all shrink-0 cursor-pointer ml-0.5"
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>

          </div>

        </div>

        {/* MOBILE MENU */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-zinc-950/98 border-b border-zinc-800/90 p-4 sm:p-5 space-y-4 animate-in slide-in-from-top-4 duration-200 shadow-2xl backdrop-blur-2xl max-h-[calc(100vh-70px)] overflow-y-auto">
            
            {!isAdmin && (
              <nav className="flex flex-col space-y-1 text-sm font-bold text-zinc-300">
                <a 
                  href="#services" 
                  onClick={(e) => scrollToSection(e, 'services')} 
                  className="p-3 rounded-xl hover:bg-zinc-900 hover:text-amber-400 transition-colors flex items-center justify-between"
                >
                  <span>Services & Prices</span>
                  <Scissors size={14} className="text-zinc-600" />
                </a>
                <a 
                  href="#barbers" 
                  onClick={(e) => scrollToSection(e, 'barbers')} 
                  className="p-3 rounded-xl hover:bg-zinc-900 hover:text-amber-400 transition-colors flex items-center justify-between"
                >
                  <span>Barbers</span>
                  <Sparkles size={14} className="text-zinc-600" />
                </a>
                <a 
                  href="#about" 
                  onClick={(e) => scrollToSection(e, 'about')} 
                  className="p-3 rounded-xl hover:bg-zinc-900 hover:text-amber-400 transition-colors"
                >
                  About Us
                </a>
                <a 
                  href="#contacts" 
                  onClick={(e) => scrollToSection(e, 'contacts')} 
                  className="p-3 rounded-xl hover:bg-zinc-900 hover:text-amber-400 transition-colors"
                >
                  Contacts
                </a>
                
                {user && (
                  <button
                    onClick={handleOpenMyBookings}
                    className="p-3 rounded-xl hover:bg-zinc-900 text-amber-400 font-bold transition-colors flex items-center justify-between text-left cursor-pointer"
                  >
                    <span>My Appointments ({user.name || 'Account'})</span>
                    <BookmarkCheck size={16} />
                  </button>
                )}
              </nav>
            )}

            <div className="pt-2 border-t border-zinc-800/80 space-y-2.5">
              {!isAdmin && (
                <button 
                  onClick={handleOpenBooking}
                  className="w-full py-3.5 rounded-xl bg-amber-500 text-zinc-950 font-black text-xs shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 active:scale-98 transition-transform cursor-pointer"
                >
                  <Calendar size={16} className="stroke-[2.5]" />
                  <span>Book Appointment Now</span>
                </button>
              )}

              {user?.role === 'admin' && (
                <button 
                  onClick={() => { setIsAdmin(!isAdmin); setMobileMenuOpen(false); }}
                  className="w-full py-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 font-extrabold text-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isAdmin ? <User size={15} /> : <Shield size={15} />}
                  <span>{isAdmin ? 'Switch to Client View' : 'Open Admin Panel'}</span>
                </button>
              )}

              {user ? (
                <button 
                  onClick={() => { setMobileMenuOpen(false); onLogout(); }}
                  className="w-full py-3 rounded-xl bg-zinc-900 text-rose-400 hover:bg-rose-500/10 font-bold text-xs border border-zinc-800 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogOut size={15} />
                  <span>Sign Out</span>
                </button>
              ) : (
                <button 
                  onClick={() => { setMobileMenuOpen(false); if (onAuthClick) onAuthClick(); }}
                  className="w-full py-3 rounded-xl bg-zinc-900 text-zinc-200 hover:text-white font-bold text-xs border border-zinc-800 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogIn size={15} className="text-amber-500" />
                  <span>Sign In / Register</span>
                </button>
              )}
            </div>

          </div>
        )}

      </header>

      {/* MODAL: MY BOOKINGS (Client Profile) */}
      {isBookingsOpen && user && (
        <ClientProfile 
          user={user} 
          tenant={tenant}
          onClose={() => setIsBookingsOpen(false)} 
          onOpenRescheduleModal={(booking) => {
            setIsBookingsOpen(false);
            if (typeof onOpenRescheduleModal === 'function') {
              onOpenRescheduleModal(booking);
            }
          }}
        />
      )}
    </>
  );
}