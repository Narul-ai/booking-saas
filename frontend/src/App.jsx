import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Header from './components/Header';
import Hero from './components/Hero';
import ServicesSection from './components/ServicesSection';
import StaffSection from './components/StaffSection';
import BookingModal from './components/BookingModal';
import AuthModal from './components/AuthModal';
import AdminPanel from "./components/admin/AdminPanel";
import AboutSection from './components/AboutSection';
import ContactsSection from './components/ContactsSection';
import Footer from './components/Footer';

const API_URL = 'http://localhost:5000/api';
const TENANT_ID = '6a65b30e875a7c8ce5664fa2';

function App() {
  const [tenant, setTenant] = useState(null);
  const [services, setServices] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // User session and modal states
  const [user, setUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  
  const [selectedService, setSelectedService] = useState('');
  const [selectedStaff, setSelectedStaff] = useState('');
  const [rescheduleBooking, setRescheduleBooking] = useState(null);

  const [pendingServiceId, setPendingServiceId] = useState('');
  const [pendingStaffId, setPendingStaffId] = useState('');

  /* ==========================================================================
     1. SESSION INITIALIZATION
     ========================================================================== */
  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }

    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        if (parsedUser?.role === 'admin') {
          setIsAdmin(true);
        }
      } catch (e) {
        console.error('Failed to parse active user session:', e);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }

    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && error.response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          delete axios.defaults.headers.common['Authorization'];
          setUser(null);
          setIsAdmin(false);
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []);

  /* ==========================================================================
     2. DATA FETCHING & STAFF STATUS HELPER
     ========================================================================== */
  const fetchData = useCallback(async () => {
    try {
      const [tenantRes, servicesRes, staffRes] = await Promise.all([
        axios.get(`${API_URL}/tenants/topgun`),
        axios.get(`${API_URL}/services/tenant/${TENANT_ID}`),
        axios.get(`${API_URL}/users/staff/${TENANT_ID}`)
      ]);

      setTenant(tenantRes.data);
      setServices(servicesRes.data);
      setStaff(staffRes.data);
    } catch (err) {
      console.error('Error fetching salon data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Универсальная функция расчёта статуса мастера на текущий день
  const getStaffStatus = useCallback((staffId) => {
    if (!staffId || !staff || staff.length === 0) return { isOff: false };

    const target = staff.find(s => 
      String(s._id || s.id) === String(staffId)
    );

    if (!target) return { isOff: false };

    // Проверка явных флагов выходных
    const isOff = Boolean(
      target.isOff || 
      target.isDayOff || 
      target.status === 'off' || 
      target.status === 'DAY OFF'
    );

    return { isOff };
  }, [staff]);

  /* ==========================================================================
     3. HANDLERS
     ========================================================================== */
  const openModal = (serviceParam = '', staffParam = '') => {
    setRescheduleBooking(null);

    const targetServiceId = typeof serviceParam === 'object' && serviceParam !== null 
      ? (serviceParam._id || serviceParam.id || '') 
      : String(serviceParam || '');

    const targetStaffId = typeof staffParam === 'object' && staffParam !== null 
      ? (staffParam._id || staffParam.id || '') 
      : String(staffParam || '');

    if (!user) {
      setPendingServiceId(targetServiceId);
      setPendingStaffId(targetStaffId);
      setIsAuthOpen(true);
    } else {
      setSelectedService(targetServiceId);
      setSelectedStaff(targetStaffId);
      setIsModalOpen(true);
    }
  };

  const handleOpenRescheduleModal = (booking) => {
    setRescheduleBooking(booking);
    const serviceId = booking.serviceId?._id || booking.serviceId || '';
    const staffId = booking.staffId?._id || booking.staffId || '';

    setSelectedService(serviceId);
    setSelectedStaff(staffId);
    setIsModalOpen(true);
  };

  const handleSelectWorkFromPortfolio = (barberParam, workParam) => {
    const targetStaffId = typeof barberParam === 'object' && barberParam !== null
      ? (barberParam._id || barberParam.id || '')
      : String(barberParam || '');

    const matchedService = services.find((s) => {
      const dbTitle = (s.title || s.name || '').toLowerCase();
      const workTitle = (workParam?.title || '').toLowerCase();
      return dbTitle === workTitle || dbTitle.includes(workTitle) || workTitle.includes(dbTitle);
    });

    const targetServiceId = matchedService ? (matchedService._id || matchedService.id) : (services[0]?._id || '');
    openModal(targetServiceId, targetStaffId);
  };

  const handleAuthSuccess = (authPayload) => {
    const userData = authPayload?.user || authPayload;
    const token = authPayload?.token;

    if (token) {
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }

    if (userData) {
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      if (userData.role === 'admin') setIsAdmin(true);
    }

    setIsAuthOpen(false);
    setSelectedService(pendingServiceId || selectedService);
    setSelectedStaff(pendingStaffId || selectedStaff);
    setPendingServiceId('');
    setPendingStaffId('');
    setIsModalOpen(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    setIsAdmin(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-zinc-400 font-medium text-sm gap-3">
        <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
        <span>Loading Barbershop...</span>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans antialiased selection:bg-amber-500 selection:text-zinc-950">
      <Header 
        tenant={tenant} 
        onOpenModal={openModal} 
        isAdmin={isAdmin} 
        setIsAdmin={setIsAdmin}
        user={user}
        onLogout={handleLogout}
        onAuthClick={() => setIsAuthOpen(true)}
        onOpenRescheduleModal={handleOpenRescheduleModal}
      />

      <main className="w-full flex-1">
        {isAdmin ? (
          <AdminPanel 
            tenantId={TENANT_ID} 
            services={services} 
            staff={staff} 
            onRefresh={fetchData} 
          />
        ) : (
          <>
            <Hero 
              onOpenBooking={openModal}
              onOpenModal={openModal} 
              staff={staff} 
              getStaffStatus={getStaffStatus} 
            />
            <ServicesSection services={services} onSelectService={openModal} />
            <StaffSection 
              staff={staff} 
              onSelectBarber={(barberId) => openModal('', barberId)}
              onOpenModal={openModal}
              onSelectWork={handleSelectWorkFromPortfolio}
            />
            <AboutSection />
            <ContactsSection />
          </>
        )}
      </main>

      {!isAdmin && <Footer tenant={tenant} />}

      {isModalOpen && (
        <BookingModal 
          tenantId={TENANT_ID}
          tenant={tenant}
          services={services}
          staff={staff}
          selectedService={selectedService}
          setSelectedService={setSelectedService}
          selectedStaff={selectedStaff}
          setSelectedStaff={setSelectedStaff}
          rescheduleBooking={rescheduleBooking}
          onClose={() => {
            setIsModalOpen(false);
            setRescheduleBooking(null);
          }}
        />
      )}

      <AuthModal 
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
}

export default App;