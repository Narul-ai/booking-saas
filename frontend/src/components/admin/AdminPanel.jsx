import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { 
  DollarSign, 
  Calendar, 
  Users, 
  Scissors, 
  RefreshCw, 
  CheckCircle2, 
  TrendingUp, 
  Clock, 
  Plus, 
  Radio,
  Filter,
  Layers,
  Sparkles
} from 'lucide-react';
import BookingsTab from './BookingsTab';
import ServicesTab from './ServicesTab';
import StaffTab from './StaffTab';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function AdminPanel({ tenantId, services = [], staff = [], onRefresh }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('bookings');
  
  // Дополнительные фичи управления UI
  const [timeRange, setTimeRange] = useState('all'); // 'today' | 'week' | 'month' | 'all'
  const [lastSynced, setLastSynced] = useState(null);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  };

  const fetchBookings = async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/bookings/tenant/${tenantId}`, getAuthHeaders());
      setBookings(Array.isArray(res.data) ? res.data : []);
      setLastSynced(new Date());
    } catch (err) {
      console.error('Error loading bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [tenantId]);

  // Фильтрация бронирований по выбранному таймфрейму
  const filteredByTimeBookings = useMemo(() => {
    if (timeRange === 'all') return bookings;

    const now = new Date();
    return bookings.filter((b) => {
      const bookingDate = new Date(b.startDatetime || b.createdAt);
      if (isNaN(bookingDate.getTime())) return false;

      if (timeRange === 'today') {
        return bookingDate.toDateString() === now.toDateString();
      }
      if (timeRange === 'week') {
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return bookingDate >= oneWeekAgo && bookingDate <= now;
      }
      if (timeRange === 'month') {
        return (
          bookingDate.getMonth() === now.getMonth() &&
          bookingDate.getFullYear() === now.getFullYear()
        );
      }
      return true;
    });
  }, [bookings, timeRange]);

  // Вычисление ключевых показателей (KPIs)
  const kpis = useMemo(() => {
    let totalRevenue = 0;
    let confirmedCount = 0;
    let pendingCount = 0;
    let cancelledCount = 0;

    filteredByTimeBookings.forEach((b) => {
      const price = Number(b.serviceId?.price ?? b.price) || 0;
      const status = (b.status || 'pending').toLowerCase();

      if (status === 'confirmed' || status === 'completed') {
        totalRevenue += price;
        confirmedCount++;
      } else if (status === 'pending') {
        pendingCount++;
      } else if (status === 'cancelled') {
        cancelledCount++;
      }
    });

    const totalCount = filteredByTimeBookings.length;
    const conversionRate = totalCount > 0 ? Math.round((confirmedCount / totalCount) * 100) : 0;
    const avgCheck = confirmedCount > 0 ? Math.round(totalRevenue / confirmedCount) : 0;

    return {
      totalRevenue,
      totalBookings: totalCount,
      confirmedCount,
      pendingCount,
      cancelledCount,
      conversionRate,
      avgCheck,
      activeStaff: staff.length,
      activeServices: services.length
    };
  }, [filteredByTimeBookings, staff, services]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 py-8 px-4 sm:px-6 lg:px-10 font-sans selection:bg-amber-500/30 selection:text-amber-200">
      <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
        
        {/* TOP BAR / SYSTEM STATUS & QUICK CONTROLS */}
        <div className="flex items-center justify-between bg-zinc-900/40 border border-zinc-800/80 px-4 py-2.5 rounded-2xl backdrop-blur-md">
          <div className="flex items-center gap-2.5 text-xs text-zinc-400">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="font-semibold text-zinc-300">Live Workspace</span>
            <span className="text-zinc-600">•</span>
            <span>
              Tenant ID: <code className="bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded text-amber-400 font-mono text-[11px]">{tenantId || 'N/A'}</code>
            </span>
          </div>

          {lastSynced && (
            <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-zinc-500 font-mono">
              <Clock size={12} className="text-zinc-400" />
              <span>Synced {lastSynced.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          )}
        </div>

        {/* HEADER SECTION */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-zinc-800/80 pb-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 px-3 py-1 rounded-full text-amber-400 text-xs font-extrabold tracking-wide uppercase shadow-sm">
              <Scissors size={13} className="text-amber-400" />
              <span>Barbershop Enterprise Suite</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight flex items-center gap-3">
              Control Panel
            </h1>
            <p className="text-xs text-zinc-400 max-w-xl">
              Monitor appointments, track revenue stream, optimize services catalog and staff scheduling in real-time.
            </p>
          </div>

          {/* RIGHT ACTION CONTROLS */}
          <div className="flex flex-wrap items-center gap-3">
            
            {/* Time Period Selector */}
            <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-xl p-1 text-xs font-semibold">
              <button
                onClick={() => setTimeRange('all')}
                className={`px-3 py-1.5 rounded-lg transition-all ${timeRange === 'all' ? 'bg-amber-500 text-black font-bold shadow' : 'text-zinc-400 hover:text-white'}`}
              >
                All Time
              </button>
              <button
                onClick={() => setTimeRange('month')}
                className={`px-3 py-1.5 rounded-lg transition-all ${timeRange === 'month' ? 'bg-amber-500 text-black font-bold shadow' : 'text-zinc-400 hover:text-white'}`}
              >
                This Month
              </button>
              <button
                onClick={() => setTimeRange('week')}
                className={`px-3 py-1.5 rounded-lg transition-all ${timeRange === 'week' ? 'bg-amber-500 text-black font-bold shadow' : 'text-zinc-400 hover:text-white'}`}
              >
                7 Days
              </button>
            </div>

            {/* Sync Button */}
            <button 
              onClick={() => { fetchBookings(); if (onRefresh) onRefresh(); }}
              disabled={loading}
              className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 px-4 py-2.5 rounded-xl text-xs font-bold text-zinc-200 hover:text-white transition-all duration-200 active:scale-95 shadow-lg shadow-black/20 disabled:opacity-50"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin text-amber-400' : 'text-zinc-400'} />
              <span>Sync</span>
            </button>
          </div>
        </div>

        {/* METRICS & KPIS BAR */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Revenue */}
          <div className="bg-gradient-to-br from-zinc-900/90 to-zinc-900/40 hover:to-zinc-900/80 border border-zinc-800/80 hover:border-amber-500/30 rounded-2xl p-5 transition-all duration-300 group hover:shadow-xl hover:shadow-amber-500/5 hover:-translate-y-0.5 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-500 group-hover:text-zinc-400">Est. Revenue</p>
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-110 group-hover:bg-amber-500/20 transition-all">
                <DollarSign size={20} />
              </div>
            </div>
            <div className="mt-2">
              <p className="text-3xl font-black text-white font-mono tracking-tight group-hover:text-amber-400 transition-colors">
                ${kpis.totalRevenue.toLocaleString()}
              </p>
              <p className="text-[11px] text-zinc-500 mt-1 flex items-center gap-1 font-medium">
                <TrendingUp size={12} className="text-emerald-400" /> Avg check: <span className="text-zinc-300 font-bold font-mono">${kpis.avgCheck}</span>
              </p>
            </div>
          </div>

          {/* Bookings */}
          <div className="bg-gradient-to-br from-zinc-900/90 to-zinc-900/40 hover:to-zinc-900/80 border border-zinc-800/80 hover:border-blue-500/30 rounded-2xl p-5 transition-all duration-300 group hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-0.5">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-500 group-hover:text-zinc-400">Total Appointments</p>
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 group-hover:bg-blue-500/20 transition-all">
                <Calendar size={20} />
              </div>
            </div>
            <div className="mt-2">
              <p className="text-3xl font-black text-white font-mono tracking-tight group-hover:text-blue-400 transition-colors">
                {kpis.totalBookings}
              </p>
              <p className="text-[11px] text-zinc-500 mt-1 font-medium">
                Pending action: <span className="text-amber-400 font-bold font-mono">{kpis.pendingCount} slots</span>
              </p>
            </div>
          </div>

          {/* Conversion */}
          <div className="bg-gradient-to-br from-zinc-900/90 to-zinc-900/40 hover:to-zinc-900/80 border border-zinc-800/80 hover:border-emerald-500/30 rounded-2xl p-5 transition-all duration-300 group hover:shadow-xl hover:shadow-emerald-500/5 hover:-translate-y-0.5">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-500 group-hover:text-zinc-400">Confirmation Rate</p>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 group-hover:bg-emerald-500/20 transition-all">
                <CheckCircle2 size={20} />
              </div>
            </div>
            <div className="mt-2">
              <p className="text-3xl font-black text-emerald-400 font-mono tracking-tight">
                {kpis.conversionRate}%
              </p>
              <p className="text-[11px] text-zinc-500 mt-1 font-medium">
                Confirmed: <span className="text-white font-bold">{kpis.confirmedCount}</span> / Cancelled: <span className="text-rose-400 font-bold">{kpis.cancelledCount}</span>
              </p>
            </div>
          </div>

          {/* Staff & Services */}
          <div className="bg-gradient-to-br from-zinc-900/90 to-zinc-900/40 hover:to-zinc-900/80 border border-zinc-800/80 hover:border-purple-500/30 rounded-2xl p-5 transition-all duration-300 group hover:shadow-xl hover:shadow-purple-500/5 hover:-translate-y-0.5">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-500 group-hover:text-zinc-400">Team & Offerings</p>
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-110 group-hover:bg-purple-500/20 transition-all">
                <Users size={20} />
              </div>
            </div>
            <div className="mt-2">
              <p className="text-3xl font-black text-white font-mono tracking-tight group-hover:text-purple-400 transition-colors">
                {kpis.activeStaff} <span className="text-xs font-normal text-zinc-500">Barbers</span>
              </p>
              <p className="text-[11px] text-zinc-500 mt-1 font-medium">
                Active catalog: <span className="text-amber-400 font-bold">{kpis.activeServices} services</span>
              </p>
            </div>
          </div>

        </div>

        {/* NAVIGATION TABS */}
        <div className="bg-zinc-900/40 border border-zinc-800/80 p-1.5 rounded-2xl flex items-center gap-2 overflow-x-auto no-scrollbar">
          
          <button
            onClick={() => setActiveTab('bookings')}
            className={`flex-1 py-3 px-5 rounded-xl text-xs font-bold transition-all duration-200 whitespace-nowrap flex items-center justify-center gap-2.5 active:scale-[0.98] ${
              activeTab === 'bookings'
                ? 'bg-zinc-800 text-white shadow-lg border border-zinc-700/60'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
            }`}
          >
            <Calendar size={16} className={activeTab === 'bookings' ? 'text-amber-400' : 'text-zinc-500'} /> 
            <span>Bookings Monitor</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold font-mono transition-colors ${
              activeTab === 'bookings' ? 'bg-amber-500 text-black' : 'bg-zinc-800 text-zinc-400'
            }`}>
              {filteredByTimeBookings.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('services')}
            className={`flex-1 py-3 px-5 rounded-xl text-xs font-bold transition-all duration-200 whitespace-nowrap flex items-center justify-center gap-2.5 active:scale-[0.98] ${
              activeTab === 'services'
                ? 'bg-zinc-800 text-white shadow-lg border border-zinc-700/60'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
            }`}
          >
            <Scissors size={16} className={activeTab === 'services' ? 'text-amber-400' : 'text-zinc-500'} /> 
            <span>Services Catalog</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold font-mono transition-colors ${
              activeTab === 'services' ? 'bg-amber-500 text-black' : 'bg-zinc-800 text-zinc-400'
            }`}>
              {services.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('staff')}
            className={`flex-1 py-3 px-5 rounded-xl text-xs font-bold transition-all duration-200 whitespace-nowrap flex items-center justify-center gap-2.5 active:scale-[0.98] ${
              activeTab === 'staff'
                ? 'bg-zinc-800 text-white shadow-lg border border-zinc-700/60'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
            }`}
          >
            <Users size={16} className={activeTab === 'staff' ? 'text-amber-400' : 'text-zinc-500'} /> 
            <span>Barber Team</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold font-mono transition-colors ${
              activeTab === 'staff' ? 'bg-amber-500 text-black' : 'bg-zinc-800 text-zinc-400'
            }`}>
              {staff.length}
            </span>
          </button>

        </div>

        {/* TAB CONTENTS VIEW */}
        <div className="transition-all duration-300">
          {activeTab === 'bookings' && (
            <BookingsTab 
              bookings={filteredByTimeBookings} 
              loading={loading} 
              API_URL={API_URL} 
              getAuthHeaders={getAuthHeaders} 
              fetchBookings={fetchBookings} 
            />
          )}

          {activeTab === 'services' && (
            <ServicesTab 
              tenantId={tenantId} 
              services={services} 
              API_URL={API_URL} 
              getAuthHeaders={getAuthHeaders} 
              onRefresh={onRefresh} 
            />
          )}

          {activeTab === 'staff' && (
            <StaffTab 
              tenantId={tenantId} 
              staff={staff} 
              API_URL={API_URL} 
              getAuthHeaders={getAuthHeaders} 
              onRefresh={onRefresh} 
            />
          )}
        </div>

      </div>
    </div>
  );
}