import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  Mail, 
  X, 
  CheckCircle2, 
  XCircle, 
  Scissors,
  Loader2,
  CalendarSync,
  Sparkles,
  Send,
  Check
} from 'lucide-react';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api';
const BOT_USERNAME = 'topgun_booking_bot'; // Имя твоего Telegram бота

export default function ClientProfile({ user, tenant, onClose, onOpenRescheduleModal }) {
  const [activeTab, setActiveTab] = useState('upcoming');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);

  const userPhone = user?.phone || user?.phoneNumber || user?.clientPhone;
  const tenantId = tenant?._id || tenant?.id;
  const userId = user?.id || user?._id;

  // Ссылка для Deep Linking в Telegram
  const telegramUrl = `https://t.me/${BOT_USERNAME}?start=${userId}`;

  useEffect(() => {
    if (user) {
      fetchUserBookings();
    }
  }, [user, tenant]);

  const fetchUserBookings = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/bookings`, {
        params: { 
          userId: userId, 
          phone: userPhone,
          tenantId: tenantId
        }
      });
      const data = Array.isArray(res.data) ? res.data : (res.data?.bookings || []);
      setBookings(data);
    } catch (err) {
      console.error('Failed to load user bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    setCancellingId(bookingId);
    try {
      const token = localStorage.getItem('token'); 

      await axios.patch(
        `${API_URL}/bookings/${bookingId}/cancel`, 
        { tenantId: tenantId },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setBookings(prev => 
        prev.map(b => (b._id === bookingId || b.id === bookingId) ? { ...b, status: 'cancelled' } : b)
      );
    } catch (err) {
      console.error('Failed to cancel appointment:', err);
      alert('Failed to cancel appointment. ' + (err.response?.data?.message || ''));
    } finally {
      setCancellingId(null);
    }
  };

  const handleReschedule = (booking) => {
    if (onOpenRescheduleModal) {
      onOpenRescheduleModal(booking);
    } else {
      alert('Reschedule modal handler is not passed to ClientProfile.');
    }
  };

const now = new Date();
const upcomingBookings = bookings.filter(b => {
  if (b.status === 'cancelled' || b.status === 'completed') return false;
  const bookingDate = new Date(b.startDatetime || b.date);
  return bookingDate >= now; // Показываем только будущее время
});

const historyBookings = bookings.filter(b => {
  if (b.status === 'cancelled' || b.status === 'completed') return true;
  const bookingDate = new Date(b.startDatetime || b.date);
  return bookingDate < now; // Прошедшие даты автоматически идут в History
});

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : (user?.email ? user.email.charAt(0).toUpperCase() : 'U');

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-xl flex items-center justify-center p-4 z-[100] animate-in fade-in duration-300">
      <div className="bg-[#121214] border border-amber-500/20 w-full max-w-2xl rounded-3xl overflow-hidden shadow-[0_0_80px_rgba(245,158,11,0.15)] relative flex flex-col max-h-[85vh]">
        
        {/* HEADER */}
        <div className="p-6 border-b border-zinc-800/80 bg-gradient-to-r from-zinc-950 via-[#161618] to-zinc-950 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 text-black font-black text-xl flex items-center justify-center shadow-lg shadow-amber-500/25 ring-2 ring-amber-500/40">
              {userInitial}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-white tracking-wide">{user?.name || 'Gentleman Account'}</h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1 shadow-sm">
                  <Sparkles size={10} /> Client
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-medium mt-0.5">{userPhone || user?.email || 'TopGun Barbershop'}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2.5 rounded-2xl text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-all cursor-pointer active:scale-95 border border-transparent hover:border-zinc-700/60"
          >
            <X size={18} />
          </button>
        </div>

        {/* TELEGRAM NOTIFICATION BANNER */}
        <div className="px-6 pt-5">
          <div className="p-4 rounded-2xl bg-gradient-to-r from-zinc-900/90 via-zinc-900 to-amber-950/20 border border-amber-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg shadow-black/50 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex items-center gap-3.5 z-10">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-amber-500 text-black flex items-center justify-center shadow-md shadow-sky-500/20 shrink-0">
                <Send size={18} className="fill-current text-zinc-950" />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
                  Never Miss Your Barber Appointment
                </h4>
                <p className="text-[11px] text-zinc-400 font-medium mt-0.5">
                 Get instant Telegram updates, reminders, and status changes.
                </p>
              </div>
            </div>

            <div className="w-full sm:w-auto z-10 shrink-0">
              {user?.telegramChatId ? (
                <span className="w-full sm:w-auto px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center justify-center gap-1.5">
                  <Check size={14} /> Telegram Connected
                </span>
              ) : (
                <a
                  href={telegramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black text-xs font-black tracking-wide shadow-md shadow-amber-500/20 transition-all flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <Send size={13} className="fill-current" />
                  Connect Telegram
                </a>
              )}
            </div>
          </div>
        </div>

        {/* TABS */}
        <div className="flex border-b border-zinc-800/80 px-6 gap-8 text-xs font-bold text-zinc-400 mt-2">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`py-3.5 border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'upcoming' 
                ? 'border-amber-500 text-amber-400' 
                : 'border-transparent hover:text-zinc-200'
            }`}
          >
            <Calendar size={15} />
            <span>Upcoming</span>
            <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-[10px] font-extrabold text-amber-400 border border-amber-500/20">
              {upcomingBookings.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`py-3.5 border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'history' 
                ? 'border-amber-500 text-amber-400' 
                : 'border-transparent hover:text-zinc-200'
            }`}
          >
            <Clock size={15} />
            <span>History</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`py-3.5 border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'profile' 
                ? 'border-amber-500 text-amber-400' 
                : 'border-transparent hover:text-zinc-200'
            }`}
          >
            <User size={15} />
            <span>My Info</span>
          </button>
        </div>

        {/* CONTENT AREA */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-amber-400 text-xs font-bold gap-3">
              <Loader2 size={24} className="animate-spin text-amber-500" /> 
              <span className="text-zinc-400 tracking-wider">Syncing your appointments...</span>
            </div>
          ) : (
            <>
              {/* UPCOMING TAB */}
              {activeTab === 'upcoming' && (
                <div className="space-y-3">
                  {upcomingBookings.length === 0 ? (
                    <div className="text-center py-16 space-y-3 border border-dashed border-zinc-800/80 rounded-2xl bg-zinc-950/40">
                      <Scissors size={32} className="mx-auto text-amber-500/40 animate-pulse" />
                      <p className="text-xs font-bold text-zinc-400">No upcoming appointments scheduled.</p>
                    </div>
                  ) : (
                    upcomingBookings.map((b) => {
                      const id = b._id || b.id;
                      const rawDate = b.startDatetime || b.date;
                      const dateObj = rawDate ? new Date(rawDate) : null;
                      const isValidDate = dateObj && !isNaN(dateObj.getTime());

                      return (
                        <div 
                          key={id} 
                          className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-amber-500/40 transition-all duration-200 group shadow-md"
                        >
                          <div className="space-y-1.5">
                            <span className="inline-flex items-center gap-1.5 text-[10px] font-black px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
                              <CheckCircle2 size={11} /> Confirmed
                            </span>
                            <h4 className="font-black text-white text-base tracking-tight group-hover:text-amber-400 transition-colors">
                              {b.serviceId?.title || b.serviceTitle || 'Haircut Service'}
                            </h4>
                            <div className="text-xs text-zinc-400 flex flex-wrap items-center gap-3 font-medium">
                              <span>Barber: <strong className="text-zinc-200">{b.staffId?.name || b.staffName || 'Barber'}</strong></span>
                              <span className="text-zinc-700">•</span>
                              <span className="text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                                {isValidDate 
                                  ? `${dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at ${dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` 
                                  : (b.date || 'Scheduled')}
                              </span>
                            </div>
                          </div>

                          {/* ACTION BUTTONS: Reschedule + Cancel */}
                          <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-800/60">
                            <button
                              onClick={() => handleReschedule(b)}
                              className="flex-1 sm:flex-none px-3.5 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-xl text-xs font-bold transition-all border border-amber-500/30 hover:border-amber-500/50 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                            >
                              <CalendarSync size={13} />
                              <span>Reschedule</span>
                            </button>

                            <button
                              onClick={() => handleCancel(id)}
                              disabled={cancellingId === id}
                              className="flex-1 sm:flex-none px-3.5 py-2 bg-zinc-950 hover:bg-rose-950/80 hover:text-rose-400 text-zinc-400 rounded-xl text-xs font-bold transition-all border border-zinc-800 hover:border-rose-800/50 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                            >
                              {cancellingId === id ? <Loader2 size={13} className="animate-spin" /> : 'Cancel'}
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* HISTORY TAB */}
              {activeTab === 'history' && (
                <div className="space-y-3">
                  {historyBookings.length === 0 ? (
                    <div className="text-center py-12 text-xs text-zinc-500 font-medium">No previous bookings found.</div>
                  ) : (
                    historyBookings.map((b) => {
                      const id = b._id || b.id;
                      const isCancelled = b.status === 'cancelled';
                      const rawDate = b.startDatetime || b.date;
                      const dateObj = rawDate ? new Date(rawDate) : null;
                      const isValidDate = dateObj && !isNaN(dateObj.getTime());

                      return (
                        <div key={id} className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/50 flex items-center justify-between opacity-80 hover:opacity-100 transition-opacity">
                          <div className="space-y-1">
                            <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-md border ${
                              isCancelled ? 'bg-rose-950/40 text-rose-400 border-rose-800/40' : 'bg-zinc-800/80 text-zinc-400 border-zinc-700/60'
                            }`}>
                              {isCancelled ? <XCircle size={10} /> : <CheckCircle2 size={10} />} {(b.status || 'completed').toUpperCase()}
                            </span>
                            <h4 className="font-bold text-zinc-300 text-sm">{b.serviceId?.title || b.serviceTitle || 'Service'}</h4>
                            <p className="text-[11px] text-zinc-500">
                              {isValidDate ? dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : (b.date || '')}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* MY INFO TAB */}
              {activeTab === 'profile' && (
                <div className="space-y-4 text-xs font-bold">
                  <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-4">
                    <div className="flex items-center gap-3 text-zinc-300 pb-3 border-b border-zinc-800/60">
                      <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        <User size={16} />
                      </div>
                      <div>
                        <span className="block text-[10px] text-zinc-500 uppercase tracking-wider font-extrabold">Full Name</span>
                        <span className="text-sm text-zinc-100">{user?.name || 'Gentleman'}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-zinc-300 pb-3 border-b border-zinc-800/60">
                      <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        <Mail size={16} />
                      </div>
                      <div>
                        <span className="block text-[10px] text-zinc-500 uppercase tracking-wider font-extrabold">Email Address</span>
                        <span className="text-sm text-zinc-100">{user?.email || 'Not specified'}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-zinc-300">
                      <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        <Phone size={16} />
                      </div>
                      <div>
                        <span className="block text-[10px] text-zinc-500 uppercase tracking-wider font-extrabold">Phone Number</span>
                        <span className="text-sm text-zinc-100">{userPhone || 'Not specified'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

      </div>
    </div>
  );
}