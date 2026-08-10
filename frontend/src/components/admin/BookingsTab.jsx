import { useState, useMemo } from 'react';
import axios from 'axios';
import { 
  Search, 
  Filter, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  X, 
  Calendar, 
  User, 
  Scissors, 
  DollarSign, 
  Loader2, 
  Eye, 
  Check, 
  CalendarDays,
  Phone,
  AlertCircle,
  Download,
  ArrowUpDown,
  MessageSquare,
  Copy,
  TrendingUp,
  Percent,
  Sparkles,
  PhoneCall,
  ExternalLink,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export default function BookingsTab({ bookings = [], loading, API_URL, getAuthHeaders, fetchBookings }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('all'); // all, today, upcoming, past
  const [sortBy, setSortBy] = useState('date-desc'); // date-desc, date-asc, price-desc, price-asc
  const [updatingId, setUpdatingId] = useState(null);
  const [copiedPhone, setCopiedPhone] = useState(false);
  
  // Пагинация
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Модалка просмотра деталей
  const [selectedBooking, setSelectedBooking] = useState(null);

  // Хелперы безопасного извлечения данных
  const getClientName = (b) => b.clientId?.name || b.clientName || 'Guest Client';
  const getClientPhone = (b) => {
  return b.clientId?.phone || b.phone || '—';
};
  'No phone provided';
  const getServiceTitle = (b) => b.serviceId?.title || b.serviceTitle || 'Standard Service';
  const getServicePrice = (b) => b.serviceId?.price ?? b.price ?? 0;
  const getStaffName = (b) => b.staffId?.name || b.staffName || 'Any Available Specialist';
  const getNotes = (b) => b.notes || b.comment || b.clientNotes || null;

  // Изменение статуса записи (Confirm, Complete, Cancel, Pending)
  const handleUpdateStatus = async (id, newStatus) => {
    setUpdatingId(id);
    try {
      await axios.patch(`${API_URL}/bookings/${id}/status`, { status: newStatus }, getAuthHeaders());
      if (fetchBookings) await fetchBookings();
      if (selectedBooking && (selectedBooking._id === id || selectedBooking.id === id)) {
        setSelectedBooking(prev => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      if (newStatus === 'cancelled') {
        try {
          await axios.patch(`${API_URL}/bookings/${id}/cancel`, {}, getAuthHeaders());
          if (fetchBookings) await fetchBookings();
          if (selectedBooking) {
            setSelectedBooking(prev => ({ ...prev, status: 'cancelled' }));
          }
        } catch (e) {
          alert('Failed to update booking status.');
        }
      } else {
        alert('Failed to update booking status.');
      }
    } finally {
      setUpdatingId(null);
    }
  };

  // Копирование телефона в буфер
  const handleCopyPhone = (phone) => {
    if (!phone || phone === 'No phone provided') return;
    navigator.clipboard.writeText(phone);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  // Экспорт текущей отфильтрованной таблицы в CSV файл
  const handleExportCSV = () => {
    if (!filteredBookings.length) return;
    
    const headers = ['ID', 'Client Name', 'Phone', 'Service', 'Specialist', 'Date & Time', 'Price ($)', 'Status'];
    const rows = filteredBookings.map(b => [
      b._id || b.id || '',
      `"${getClientName(b)}"`,
      `"${getClientPhone(b)}"`,
      `"${getServiceTitle(b)}"`,
      `"${getStaffName(b)}"`,
      `"${formatDate(b.startDatetime)}"`,
      getServicePrice(b),
      b.status || 'pending'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `bookings_export_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Комплексная фильтрация и сортировка
  const filteredBookings = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    const now = new Date().getTime();

    return bookings
      .filter((b) => {
        const clientName = getClientName(b).toLowerCase();
        const clientPhone = getClientPhone(b).toLowerCase();
        const serviceTitle = getServiceTitle(b).toLowerCase();
        const barberName = getStaffName(b).toLowerCase();

        const matchesSearch =
          !query ||
          clientName.includes(query) ||
          clientPhone.includes(query) ||
          serviceTitle.includes(query) ||
          barberName.includes(query);

        const currentStatus = (b.status || 'pending').toLowerCase();
        const matchesStatus =
          statusFilter === 'all' || currentStatus === statusFilter.toLowerCase();

        // Фильтр по времени (Today, Upcoming, Past)
        const bDate = new Date(b.startDatetime || 0).getTime();
        let matchesTime = true;
        if (timeFilter === 'today') {
          const todayStr = new Date().toDateString();
          matchesTime = new Date(b.startDatetime).toDateString() === todayStr;
        } else if (timeFilter === 'upcoming') {
          matchesTime = bDate >= now;
        } else if (timeFilter === 'past') {
          matchesTime = bDate < now;
        }

        return matchesSearch && matchesStatus && matchesTime;
      })
      .sort((a, b) => {
        const dateA = new Date(a.startDatetime || 0).getTime();
        const dateB = new Date(b.startDatetime || 0).getTime();
        const priceA = Number(getServicePrice(a));
        const priceB = Number(getServicePrice(b));

        if (sortBy === 'date-asc') return dateA - dateB;
        if (sortBy === 'price-desc') return priceB - priceA;
        if (sortBy === 'price-asc') return priceA - priceB;
        return dateB - dateA; // default: date-desc
      });
  }, [bookings, searchQuery, statusFilter, timeFilter, sortBy]);

  // Расчет страниц пагинации
  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage) || 1;
  const paginatedBookings = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredBookings.slice(start, start + itemsPerPage);
  }, [filteredBookings, currentPage]);

  // Расширенные KPI метрики
  const stats = useMemo(() => {
    const total = filteredBookings.length;
    const confirmed = filteredBookings.filter(b => (b.status || 'pending').toLowerCase() === 'confirmed').length;
    const completed = filteredBookings.filter(b => (b.status || 'pending').toLowerCase() === 'completed').length;
    const pending = filteredBookings.filter(b => (b.status || 'pending').toLowerCase() === 'pending').length;
    
    const revenue = filteredBookings
      .filter(b => (b.status || 'pending').toLowerCase() !== 'cancelled')
      .reduce((acc, b) => acc + Number(getServicePrice(b)), 0);

    const conversionRate = total > 0 ? Math.round(((confirmed + completed) / total) * 100) : 0;

    return { total, confirmed, completed, pending, revenue, conversionRate };
  }, [filteredBookings]);

  const formatDate = (dateString) => {
    if (!dateString) return 'Date N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

 const renderStatusBadge = (statusRaw) => {
    const status = (statusRaw || 'pending').toLowerCase();
    
    if (status === 'confirmed') {
      return (
        <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full font-extrabold text-[9px] sm:text-[10px] uppercase tracking-wider inline-flex items-center gap-1 sm:gap-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm shadow-emerald-500/5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <CheckCircle2 size={11} /> Confirmed
        </span>
      );
    }
    if (status === 'completed') {
      return (
        <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full font-extrabold text-[9px] sm:text-[10px] uppercase tracking-wider inline-flex items-center gap-1 bg-blue-500/10 text-blue-400 border border-blue-500/20">
          <Check size={11} /> Completed
        </span>
      );
    }
    if (status === 'cancelled') {
      return (
        <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full font-extrabold text-[9px] sm:text-[10px] uppercase tracking-wider inline-flex items-center gap-1 bg-rose-500/10 text-rose-400 border border-rose-500/20">
          <XCircle size={11} /> Cancelled
        </span>
      );
    }
    return (
      <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full font-extrabold text-[9px] sm:text-[10px] uppercase tracking-wider inline-flex items-center gap-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse">
        <Clock size={11} /> Pending
      </span>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in duration-300">
      
      {/* KPI Метрики с адаптивной сеткой */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        
        <div className="bg-zinc-900/70 border border-zinc-800/90 hover:border-zinc-700/80 rounded-xl sm:rounded-2xl p-3 sm:p-4 flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2 transition-all duration-300 group hover:shadow-lg hover:shadow-amber-500/5">
          <div>
            <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-zinc-500 group-hover:text-zinc-400 transition-colors">Total Appointments</p>
            <div className="flex flex-wrap items-baseline gap-1.5 sm:gap-2 mt-0.5">
              <p className="text-xl sm:text-2xl font-black text-white">{stats.total}</p>
              {stats.pending > 0 && (
                <span className="text-[9px] sm:text-[10px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded-md border border-amber-500/20">
                  {stats.pending} pending
                </span>
              )}
            </div>
          </div>
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-zinc-800/80 border border-zinc-700/50 flex items-center justify-center text-zinc-400 group-hover:text-amber-400 group-hover:border-amber-500/30 transition-all shrink-0">
            <CalendarDays size={18} className="sm:w-5 sm:h-5" />
          </div>
        </div>

        <div className="bg-zinc-900/70 border border-zinc-800/90 hover:border-emerald-500/30 rounded-xl sm:rounded-2xl p-3 sm:p-4 flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2 transition-all duration-300 group hover:shadow-lg hover:shadow-emerald-500/5">
          <div>
            <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-zinc-500 group-hover:text-emerald-400/80 transition-colors">Confirmed Slots</p>
            <p className="text-xl sm:text-2xl font-black text-emerald-400 mt-0.5">{stats.confirmed}</p>
          </div>
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform shrink-0">
            <CheckCircle2 size={18} className="sm:w-5 sm:h-5" />
          </div>
        </div>

        <div className="bg-zinc-900/70 border border-zinc-800/90 hover:border-amber-500/30 rounded-xl sm:rounded-2xl p-3 sm:p-4 flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2 transition-all duration-300 group hover:shadow-lg hover:shadow-amber-500/5">
          <div>
            <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-zinc-500 group-hover:text-amber-400/80 transition-colors">Est. Revenue</p>
            <p className="text-xl sm:text-2xl font-black text-amber-400 font-mono mt-0.5">${stats.revenue.toLocaleString()}</p>
          </div>
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform shrink-0">
            <DollarSign size={18} className="sm:w-5 sm:h-5" />
          </div>
        </div>

        <div className="bg-zinc-900/70 border border-zinc-800/90 hover:border-indigo-500/30 rounded-xl sm:rounded-2xl p-3 sm:p-4 flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2 transition-all duration-300 group hover:shadow-lg hover:shadow-indigo-500/5">
          <div>
            <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-zinc-500 group-hover:text-indigo-400/80 transition-colors">Confirmation Rate</p>
            <div className="flex items-center gap-1 sm:gap-1.5 mt-0.5">
              <p className="text-xl sm:text-2xl font-black text-indigo-400">{stats.conversionRate}%</p>
              <TrendingUp size={14} className="text-indigo-400" />
            </div>
          </div>
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform shrink-0">
            <Percent size={16} className="sm:w-4 sm:h-4" />
          </div>
        </div>

      </div>

      {/* Панель поиска и фильтров с горизонтальным скроллом для экранов смартфонов */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-zinc-900/50 p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl border border-zinc-800/80 focus-within:border-zinc-700 transition-colors backdrop-blur-md">
        
        {/* Поиск */}
        <div className="relative flex-1 group">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-amber-500 transition-colors" />
          <input
            type="text"
            placeholder="Search client, phone, service..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl pl-10 pr-10 py-2 sm:py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/20 transition-all duration-200"
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

        {/* Фильтры и селекторы */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
          
          {/* Фильтр по времени */}
          <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 py-1 shrink-0">
            <Calendar size={13} className="text-zinc-500 mr-1.5" />
            <select
              value={timeFilter}
              onChange={(e) => { setTimeFilter(e.target.value); setCurrentPage(1); }}
              className="bg-transparent text-[11px] sm:text-xs text-zinc-300 focus:outline-none cursor-pointer py-1"
            >
              <option value="all" className="bg-zinc-900">All Dates</option>
              <option value="today" className="bg-zinc-900">Today</option>
              <option value="upcoming" className="bg-zinc-900">Upcoming</option>
              <option value="past" className="bg-zinc-900">Past</option>
            </select>
          </div>

          {/* Фильтр по статусу */}
          <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 py-1 shrink-0">
            <Filter size={13} className="text-zinc-500 mr-1.5" />
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="bg-transparent text-[11px] sm:text-xs text-zinc-300 focus:outline-none cursor-pointer py-1"
            >
              <option value="all" className="bg-zinc-900">All Statuses</option>
              <option value="confirmed" className="bg-zinc-900">Confirmed</option>
              <option value="pending" className="bg-zinc-900">Pending</option>
              <option value="completed" className="bg-zinc-900">Completed</option>
              <option value="cancelled" className="bg-zinc-900">Cancelled</option>
            </select>
          </div>

          {/* Сортировка */}
          <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 py-1 shrink-0">
            <ArrowUpDown size={13} className="text-zinc-500 mr-1.5" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent text-[11px] sm:text-xs text-zinc-300 focus:outline-none cursor-pointer py-1"
            >
              <option value="date-desc" className="bg-zinc-900">Newest</option>
              <option value="date-asc" className="bg-zinc-900">Oldest</option>
              <option value="price-desc" className="bg-zinc-900">Price ↓</option>
              <option value="price-asc" className="bg-zinc-900">Price ↑</option>
            </select>
          </div>

          {/* Кнопка экспорта в CSV */}
          <button
            onClick={handleExportCSV}
            disabled={filteredBookings.length === 0}
            className="flex items-center gap-1.5 bg-zinc-800/80 hover:bg-zinc-700/80 border border-zinc-700/60 text-zinc-200 hover:text-white text-xs font-semibold px-3 py-2 sm:py-2.5 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 shrink-0"
            title="Export to CSV report"
          >
            <Download size={13} />
            <span className="hidden sm:inline">Export</span>
          </button>

        </div>
      </div>

      {/* Таблица / Список записей */}
      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl sm:rounded-2xl overflow-hidden shadow-xl backdrop-blur-sm relative">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 sm:py-20 text-zinc-500 text-xs gap-3">
            <Loader2 size={28} className="animate-spin text-amber-500" />
            <span className="font-mono tracking-wide text-zinc-400">Fetching live booking schedule...</span>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="text-center py-12 sm:py-20 text-zinc-500 text-xs font-medium space-y-3 px-4">
            <div className="w-12 h-12 rounded-2xl bg-zinc-800/50 border border-zinc-700/40 flex items-center justify-center mx-auto text-zinc-500">
              <AlertCircle size={24} />
            </div>
            <p className="text-zinc-300 font-bold text-sm">No matching bookings found</p>
            <p className="text-zinc-500 max-w-xs mx-auto text-[11px]">We couldn't find any reservation matching your current search query or active filters.</p>
            {(searchQuery || statusFilter !== 'all' || timeFilter !== 'all') && (
              <button 
                onClick={() => { setSearchQuery(''); setStatusFilter('all'); setTimeFilter('all'); }}
                className="text-amber-400 hover:text-amber-300 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all hover:scale-105 inline-flex items-center gap-1.5 mt-2"
              >
                <Sparkles size={12} /> Reset all filters
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table - Для экранов от sm */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-950/70 text-zinc-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3.5 px-4">Client Details</th>
                    <th className="py-3.5 px-4">Service</th>
                    <th className="py-3.5 px-4">Specialist</th>
                    <th className="py-3.5 px-4">Date & Time</th>
                    <th className="py-3.5 px-4">Price</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 font-medium">
                  {paginatedBookings.map((b) => {
                    const id = b._id || b.id;
                    const status = (b.status || 'pending').toLowerCase();
                    const isUpdating = updatingId === id;
                    const hasNote = Boolean(getNotes(b));

                    return (
                      <tr 
                        key={id} 
                        className="hover:bg-zinc-800/40 transition-colors duration-150 group cursor-pointer"
                        onClick={() => setSelectedBooking(b)}
                      >
                        {/* Клиент */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-white group-hover:text-amber-400 transition-colors flex items-center gap-1.5">
                            <User size={13} className="text-zinc-500 group-hover:text-amber-400 shrink-0" />
                            <span>{getClientName(b)}</span>
                            {hasNote && (
                              <span title="Has client note" className="w-2 h-2 rounded-full bg-amber-400 shrink-0"></span>
                            )}
                          </div>
                          <div className="text-[10px] text-zinc-500 font-mono ml-4 flex items-center gap-1">
                            <span>{getClientPhone(b)}</span>
                          </div>
                        </td>

                        {/* Услуга */}
                        <td className="py-3.5 px-4 text-zinc-200">
                          <div className="flex items-center gap-1.5 font-semibold">
                            <Scissors size={13} className="text-amber-500/70 shrink-0" />
                            <span className="truncate max-w-[140px]">{getServiceTitle(b)}</span>
                          </div>
                        </td>

                        {/* Мастер */}
                        <td className="py-3.5 px-4 text-zinc-300">
                          <span className="bg-zinc-950 px-2 py-1 rounded-lg border border-zinc-800 text-[11px]">
                            {getStaffName(b)}
                          </span>
                        </td>

                        {/* Дата и Время */}
                        <td className="py-3.5 px-4 text-zinc-400">
                          <div className="flex items-center gap-1.5 font-mono text-[11px]">
                            <Clock size={12} className="text-amber-500/80 shrink-0" />
                            <span>{formatDate(b.startDatetime)}</span>
                          </div>
                        </td>

                        {/* Цена */}
                        <td className="py-3.5 px-4 font-bold text-amber-400 font-mono text-sm">
                          ${getServicePrice(b)}
                        </td>

                        {/* Статус */}
                        <td className="py-3.5 px-4">
                          {renderStatusBadge(status)}
                        </td>

                        {/* Действия */}
                        <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            <select
                              value={status}
                              disabled={isUpdating}
                              onChange={(e) => handleUpdateStatus(id, e.target.value)}
                              className="bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-[10px] font-bold text-zinc-300 rounded-lg px-2 py-1 focus:outline-none cursor-pointer transition-colors"
                            >
                              <option value="pending">Pending</option>
                              <option value="confirmed">Confirmed</option>
                              <option value="completed">Completed</option>
                              <option value="cancelled">Cancelled</option>
                            </select>

                            {status === 'pending' && (
                              <button
                                onClick={() => handleUpdateStatus(id, 'confirmed')}
                                disabled={isUpdating}
                                className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 text-[10px] font-bold transition-all disabled:opacity-50"
                                title="Quick Confirm"
                              >
                                {isUpdating ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                              </button>
                            )}

                            <button
                              onClick={() => setSelectedBooking(b)}
                              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all border border-transparent hover:border-zinc-700"
                              title="View Full Details"
                            >
                              <Eye size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile View - Карточки вместо таблицы для смартфонов */}
            <div className="block sm:hidden divide-y divide-zinc-800/80">
              {paginatedBookings.map((b) => {
                const id = b._id || b.id;
                const status = (b.status || 'pending').toLowerCase();
                const isUpdating = updatingId === id;
                const hasNote = Boolean(getNotes(b));

                return (
                  <div 
                    key={id} 
                    className="p-3.5 space-y-2.5 bg-zinc-900/40 active:bg-zinc-800/60 transition-colors"
                    onClick={() => setSelectedBooking(b)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="font-bold text-white text-sm flex items-center gap-1.5">
                          <User size={13} className="text-amber-500 shrink-0" />
                          <span>{getClientName(b)}</span>
                          {hasNote && <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0"></span>}
                        </div>
                        <p className="text-[10px] text-zinc-400 font-mono pl-4">{getClientPhone(b)}</p>
                      </div>
                      <div className="shrink-0">
                        {renderStatusBadge(status)}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-800/50">
                      <div className="space-y-1">
                        <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Service</p>
                        <p className="text-zinc-200 font-semibold truncate flex items-center gap-1">
                          <Scissors size={11} className="text-amber-500 shrink-0" /> {getServiceTitle(b)}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Price / Master</p>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-amber-400 font-mono">${getServicePrice(b)}</span>
                          <span className="text-[10px] text-zinc-400 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">{getStaffName(b)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-0.5">
                      <div className="flex items-center gap-1 text-zinc-400 font-mono text-[10px]">
                        <Clock size={11} className="text-amber-500 shrink-0" />
                        <span>{formatDate(b.startDatetime)}</span>
                      </div>

                      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={status}
                          disabled={isUpdating}
                          onChange={(e) => handleUpdateStatus(id, e.target.value)}
                          className="bg-zinc-950 border border-zinc-800 text-[10px] font-bold text-zinc-300 rounded-lg px-2 py-1 focus:outline-none"
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                        
                        <button
                          onClick={() => setSelectedBooking(b)}
                          className="p-1 rounded-lg bg-zinc-800 text-zinc-300"
                        >
                          <Eye size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Футер таблицы с пагинацией */}
            <div className="py-3 px-3 sm:px-4 bg-zinc-950/80 border-t border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs text-zinc-400">
              <div className="text-[11px] sm:text-xs">
                Showing <span className="text-white font-bold">{paginatedBookings.length}</span> of <span className="text-white font-bold">{filteredBookings.length}</span> entries
              </div>

              {totalPages > 1 && (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 disabled:opacity-40 transition-all"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <span className="px-2 sm:px-3 font-mono text-[10px] sm:text-[11px] text-zinc-400">
                    Page <span className="text-amber-400 font-bold">{currentPage}</span> / {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 disabled:opacity-40 transition-all"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Адаптированное модальное окно */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 animate-fade-in overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-6 w-full max-w-lg shadow-2xl relative space-y-4 sm:space-y-5 my-auto max-h-[90vh] overflow-y-auto">
            
            {/* Header */}
            <div className="flex justify-between items-start pb-3 sm:pb-4 border-b border-zinc-800">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-500">
                    Booking Drawer
                  </span>
                  {renderStatusBadge(selectedBooking.status)}
                </div>
                <h3 className="text-sm sm:text-base font-bold text-white mt-1 flex items-center gap-2">
                  ID: <span className="font-mono text-zinc-400 text-xs truncate max-w-[150px]">{selectedBooking._id || selectedBooking.id}</span>
                </h3>
              </div>
              <button
                onClick={() => setSelectedBooking(null)}
                className="text-zinc-500 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            {/* Быстрое управление статусом прямо в модалке */}
            <div className="bg-zinc-950 p-2.5 sm:p-3 rounded-xl border border-zinc-800/80 flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2">
              <span className="text-xs text-zinc-400 font-medium">Update Status:</span>
              <div className="flex flex-wrap gap-1">
                {['confirmed', 'completed', 'cancelled'].map((st) => (
                  <button
                    key={st}
                    onClick={() => handleUpdateStatus(selectedBooking._id || selectedBooking.id, st)}
                    disabled={updatingId === (selectedBooking._id || selectedBooking.id)}
                    className={`px-2 py-1 rounded-lg text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider border transition-all ${
                      (selectedBooking.status || 'pending').toLowerCase() === st
                        ? 'bg-amber-500 text-black border-amber-500'
                        : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white hover:bg-zinc-800'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Сетка данных с адаптивными колонками */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 text-xs">
              
              {/* Клиент */}
              <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800/80 space-y-1 relative group">
                <p className="text-[9px] sm:text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Client Info</p>
                <p className="font-bold text-white flex items-center gap-1.5 text-xs sm:text-sm">
                  <User size={14} className="text-amber-500 shrink-0" /> {getClientName(selectedBooking)}
                </p>
                
                <div className="flex items-center justify-between text-zinc-400 font-mono text-[11px] pt-1">
                  <span className="flex items-center gap-1 truncate">
                    <Phone size={11} className="text-zinc-500 shrink-0" /> {getClientPhone(selectedBooking)}
                  </span>
                  {getClientPhone(selectedBooking) !== 'No phone provided' && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleCopyPhone(getClientPhone(selectedBooking))}
                        className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white transition-colors"
                        title="Copy Phone"
                      >
                        {copiedPhone ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                      </button>
                      <a
                        href={`tel:${getClientPhone(selectedBooking)}`}
                        className="p-1 hover:bg-zinc-800 rounded text-amber-400 transition-colors"
                        title="Call Client"
                      >
                        <PhoneCall size={11} />
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Барбер */}
              <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800/80 space-y-1">
                <p className="text-[9px] sm:text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Assigned Barber</p>
                <p className="font-bold text-white flex items-center gap-1.5 text-xs sm:text-sm">
                  <User size={14} className="text-amber-500 shrink-0" /> {getStaffName(selectedBooking)}
                </p>
                <p className="text-zinc-500 text-[10px] pt-0.5">Barber Shop Specialist</p>
              </div>

              {/* Услуга */}
              <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800/80 space-y-1">
                <p className="text-[9px] sm:text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Reserved Service</p>
                <p className="font-bold text-white flex items-center gap-1.5 text-xs sm:text-sm">
                  <Scissors size={14} className="text-amber-500 shrink-0" /> {getServiceTitle(selectedBooking)}
                </p>
                <p className="text-amber-400 font-black font-mono text-sm sm:text-base pt-0.5">${getServicePrice(selectedBooking)}</p>
              </div>

              {/* Время */}
              <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800/80 space-y-1">
                <p className="text-[9px] sm:text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Scheduled Date</p>
                <p className="font-bold text-white flex items-center gap-1.5 font-mono text-[11px] sm:text-xs">
                  <Calendar size={14} className="text-amber-500 shrink-0" /> {formatDate(selectedBooking.startDatetime)}
                </p>
                <p className="text-zinc-500 text-[10px] font-mono pt-0.5">Duration ~45 mins</p>
              </div>

            </div>

            {/* Примечания клиента */}
            {getNotes(selectedBooking) && (
              <div className="bg-amber-500/5 border border-amber-500/20 p-3 rounded-xl space-y-1">
                <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                  <MessageSquare size={11} /> Client Note / Comment
                </p>
                <p className="text-xs text-zinc-300 italic">"{getNotes(selectedBooking)}"</p>
              </div>
            )}

            {/* Footer */}
            <div className="pt-3 border-t border-zinc-800 flex justify-between items-center gap-2">
              <span className="text-[9px] sm:text-[10px] text-zinc-500 font-mono truncate">
                Created: {formatDate(selectedBooking.createdAt || selectedBooking.startDatetime)}
              </span>
              <button
                onClick={() => setSelectedBooking(null)}
                className="px-3.5 py-1.5 sm:px-4 sm:py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl text-xs transition-all active:scale-95 shrink-0"
              >
                Close Drawer
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}