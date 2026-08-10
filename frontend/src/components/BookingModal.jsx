import { useState, useRef, useEffect, useMemo } from 'react';
import axios from 'axios';
import { 
  X, Scissors, UserCheck, User, Phone, Sparkles, 
  CheckCircle2, ChevronDown, Loader2, CreditCard, ShieldCheck, 
  Clock, Check, AlertTriangle, Info, Wallet, MessageSquare
} from 'lucide-react';
import { useBookingSlots } from "../hooks/useBookingSlots";
import DateStrip from "./booking/DateStrip";
import TimeSlotsGrid from "./booking/TimeSlotsGrid";
import BookingSuccess from "./booking/BookingSuccess";
import { useStaffAvailability } from "../hooks/useStaffAvailability";
// Импортируем хелперы мастеров и вспомогательные функции
import { 
  ALL_STAFF, 
  getBarberFullName, 
  getBarberRole, 
  isBarberWorkingOnDate, 
  isValidMongoId 
} from '../utils/staffHelpers';

const API_URL = 'http://localhost:5000/api';

/**
 * Международное форматирование телефона по стандарту E.164
 * Принимает любой код страны (+1, +44, +33, +7 и т.д.)
 */
const formatPhoneNumber = (value) => {
  if (!value) return '+';

  // 1. Извлекаем только цифры
  const digits = value.replace(/\D/g, '');
  if (!digits) return '+';

  // Ограничиваем максимум 15 цифрами (стандарт E.164)
  const truncated = digits.slice(0, 15);

  // 2. Красивое форматирование по длине
  if (truncated.length <= 3) {
    // Коды стран или короткие номера: +1, +44, +971
    return `+${truncated}`;
  }

  if (truncated.length <= 6) {
    // +123 456
    return `+${truncated.slice(0, 3)} ${truncated.slice(3)}`;
  }

  if (truncated.length <= 9) {
    // +123 456 789
    return `+${truncated.slice(0, 3)} ${truncated.slice(3, 6)} ${truncated.slice(6)}`;
  }

  if (truncated.length <= 11) {
    // Для номеров из 10-11 цифр (например, США/Канада +1 234 567 8900 или Казахстан +7 707 123 4567)
    // Формат: +1 234 567 8900 или +123 456 7890
    if (truncated.startsWith('1') || truncated.startsWith('7')) {
      return `+${truncated.slice(0, 1)} ${truncated.slice(1, 4)} ${truncated.slice(4, 7)} ${truncated.slice(7)}`;
    }
    return `+${truncated.slice(0, 3)} ${truncated.slice(3, 6)} ${truncated.slice(6, 10)}`;
  }

  // Для более длинных международных номеров (12-15 цифр)
  // Формат: +123 456 789 0123
  return `+${truncated.slice(0, 3)} ${truncated.slice(3, 6)} ${truncated.slice(6, 9)} ${truncated.slice(9)}`;
};

/**
 * Валидатор стандарта E.164 для формы (для onSubmit / e.target.checkValidity)
 */
const isValidE164 = (phone) => {
  const cleanPhone = phone.replace(/\s+/g, '');
  // Начинается с '+', от 7 до 15 цифр (международный стандарт ITU-T E.164)
  const e164Regex = /^\+[1-9]\d{6,14}$/;
  return e164Regex.test(cleanPhone);
};

const DEFAULT_SERVICES = [
  { _id: '660000000000000000000001', title: 'Executive Haircut', price: 35, durationMinutes: 45 },
  { _id: '660000000000000000000002', title: 'Beard Trim & Styling', price: 25, durationMinutes: 30 },
  { _id: '660000000000000000000003', title: 'Haircut & Beard Combo', price: 50, durationMinutes: 60 },
  { _id: '660000000000000000000004', title: 'Royal Hot Towel Shave', price: 40, durationMinutes: 45 },
];

const DEFAULT_TENANT_ID = '680000000000000000000001';

export default function BookingModal({
  isOpen = true,
  barber,
  initialDate,
  tenantId,
  services = [],
  staff = [],
  existingBookings = [],
  selectedService,
  setSelectedService,
  selectedStaff,     
  setSelectedStaff,  
  onClose,
  onBookingSuccess,
  rescheduleBookingId = null,
  rescheduleBooking = null,
  initialData = null
}) {
  const activeRescheduleId = rescheduleBookingId || rescheduleBooking?._id || rescheduleBooking?.id || initialData?._id;
  const isRescheduleMode = Boolean(activeRescheduleId);

  // Используем пропсы или дефолтные списки (с фолбэком на ALL_STAFF)
  const availableServices = services.length > 0 ? services : DEFAULT_SERVICES;
  const availableStaff = staff.length > 0 ? staff : ALL_STAFF;

  const [selectedServiceId, setSelectedServiceId] = useState(() => 
    initialData?.serviceId || selectedService || availableServices[0]?._id || availableServices[0]?.id || ''
  );

  // Логика подбора работающего мастера
  const checkBarberWorking = (barberMember, targetDateStr) => {
    if (!barberMember) return false;
    if (barberMember.isDayOff || barberMember.status === 'off') return false;
    const targetDate = targetDateStr ? new Date(targetDateStr) : new Date();
    return isBarberWorkingOnDate(barberMember, targetDate);
  };

  // 1. Фильтруем доступный персонал, исключая тех, кто на выходном
  const workingStaffList = useMemo(() => {
    return availableStaff.filter(s => checkBarberWorking(s, initialDate));
  }, [availableStaff, initialDate]);

  // 2. Инициализируем состояние с гарантированной проверкой на работающего мастера
  const [selectedStaffId, setSelectedStaffId] = useState(() => {
    const passedId = initialData?.staffId || selectedStaff || barber?._id || barber?.id;
    if (passedId) {
      const targetBarber = availableStaff.find(s => String(s._id || s.id) === String(passedId));
      if (targetBarber && checkBarberWorking(targetBarber, initialDate)) {
        return passedId;
      }
    }
    return workingStaffList[0]?._id || workingStaffList[0]?.id || availableStaff[0]?._id || availableStaff[0]?.id || '';
  });

  // 3. Автовыбор при асинхронной загрузке данных с бэкенда или смене мастера на выходного
  useEffect(() => {
    if (availableStaff.length === 0) return;

    const currentSelectedBarber = availableStaff.find(s => String(s._id || s.id) === String(selectedStaffId));

    if (!selectedStaffId || !currentSelectedBarber || !checkBarberWorking(currentSelectedBarber, initialDate)) {
      if (workingStaffList.length > 0) {
        const firstWorking = workingStaffList[0];
        setSelectedStaffId(firstWorking._id || firstWorking.id);
      }
    }
  }, [availableStaff, workingStaffList, selectedStaffId, initialDate]);

  const [fetchedBookings, setFetchedBookings] = useState([]);
  const [fetchingBookings, setFetchingBookings] = useState(false);

  const [isServiceOpen, setIsServiceOpen] = useState(false);
  const [isStaffOpen, setIsStaffOpen] = useState(false);

  const [clientName, setClientName] = useState(initialData?.clientName || '');
  const [clientPhone, setClientPhone] = useState(initialData?.clientPhone || '');
  const [comment, setComment] = useState(initialData?.comment || '');
  const [paymentMethod, setPaymentMethod] = useState('venue'); 
  const [notifyTelegram, setNotifyTelegram] = useState(true);

  const [status, setStatus] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [createdBookingDetails, setCreatedBookingDetails] = useState(null);

  const serviceRef = useRef(null);
  const staffRef = useRef(null);
  const statusTimerRef = useRef(null);

  // Поиск выбранной услуги
  const currentServiceObj = useMemo(() => {
    return availableServices.find(s => String(s._id || s.id) === String(selectedServiceId)) || availableServices[0];
  }, [availableServices, selectedServiceId]);

  // Поиск выбранного мастера
  const currentStaffObj = useMemo(() => {
    return availableStaff.find(m => {
      const mId = String(m._id || m.id || '');
      const targetId = String(selectedStaffId || '');
      return mId === targetId;
    }) || barber || workingStaffList[0] || availableStaff[0];
  }, [availableStaff, selectedStaffId, barber, workingStaffList]);

  const servicePrice = currentServiceObj?.price || 0;
  const depositAmount = Math.max(5, Math.ceil(servicePrice * 0.2)); 
  const activePrice = paymentMethod === 'online' ? depositAmount : servicePrice;

  // 1. Очистка таймера
  useEffect(() => {
    return () => {
      if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
    };
  }, []);

  // 2. Автозаполнение профиля
useEffect(() => {
  const token = localStorage.getItem('token');
  if (token) {
    axios.get(`${API_URL}/users/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        const user = res.data.user || res.data;
        if (user.name && !clientName) setClientName(user.name);
        
        if (user.phone && !clientPhone) {
          // Если из базы пришел номер, форматируем его под E.164
          setClientPhone(formatPhoneNumber(user.phone));
        }
      })
      .catch((err) => {
        console.error('Не удалось загрузить данные профиля:', err);
      });
  }
}, []);

  // 3. Объединение бронирований и исключение переноса
  const combinedBookings = useMemo(() => {
    const rawList = [...(existingBookings || []), ...(fetchedBookings || [])];
    const map = new Map();

    const targetRescheduleId = activeRescheduleId 
      ? String(activeRescheduleId?.id || activeRescheduleId?._id || activeRescheduleId).trim() 
      : null;

    rawList.forEach(b => {
      if (!b) return;

      const rawBId = b._id || b.id || b.bookingId;
      const bIdStr = rawBId ? String(rawBId?._id || rawBId?.id || rawBId).trim() : null;

      if (targetRescheduleId && bIdStr && bIdStr === targetRescheduleId) {
        return;
      }

      const start = b.startDatetime || b.startDate || b.date;
      const normalized = {
        ...b,
        staffId: typeof b.staffId === 'object' ? (b.staffId?._id || b.staffId?.id) : b.staffId,
        serviceId: typeof b.serviceId === 'object' ? (b.serviceId?._id || b.serviceId?.id) : b.serviceId,
        startDatetime: start,
        endDatetime: b.endDatetime || b.endDate
      };

      const timeKey = start ? new Date(start).getTime() : '';
      const key = bIdStr || `${timeKey}-${normalized.staffId}`;
      if (key) map.set(key, normalized);
    });

    return Array.from(map.values());
  }, [existingBookings, fetchedBookings, activeRescheduleId]);

  const {
    selectedDateStr,
    setSelectedDateStr,
    selectedSlot,
    setSelectedSlot,
    datePills,
    generatedSlots,
    selectEarliestSlot
  } = useBookingSlots({ 
    currentServiceObj, 
    currentStaffObj, 
    existingBookings: combinedBookings 
  });

  const { getStaffStatus, isStaffOff } = useStaffAvailability(availableStaff, selectedDateStr);

  // 4. Синхронизация initialDate при изменении
  useEffect(() => {
    if (initialDate) {
      setSelectedDateStr(initialDate);
      setSelectedSlot(null);
    }
  }, [initialDate, setSelectedDateStr, setSelectedSlot]);

  // 5. Сброс слота при смене мастера или услуги
  useEffect(() => {
    if (selectedStaff) {
      setSelectedStaffId(selectedStaff);
      setSelectedSlot(null);
    }
  }, [selectedStaff, setSelectedSlot]);

  useEffect(() => {
    if (selectedService) {
      setSelectedServiceId(selectedService);
      setSelectedSlot(null);
    }
  }, [selectedService, setSelectedSlot]);

  // 6. Фоновая загрузка бронирований
  useEffect(() => {
    let isMounted = true;
    const loadRealtimeBookings = async () => {
      setFetchingBookings(true);
      try {
        const finalTenantId = isValidMongoId(tenantId) ? tenantId : DEFAULT_TENANT_ID;
        const res = await axios.get(`${API_URL}/bookings`, {
          params: { tenantId: finalTenantId, date: selectedDateStr, staffId: selectedStaffId }
        });
        if (isMounted) {
          const list = Array.isArray(res.data) ? res.data : (res.data?.bookings || []);
          setFetchedBookings(list);
        }
      } catch (err) {
        if (isMounted) {
          setStatus({ text: 'Failed to update schedule slots in background.', type: 'error' });
        }
      } finally {
        if (isMounted) setFetchingBookings(false);
      }
    };
    loadRealtimeBookings();
    return () => { isMounted = false; };
  }, [selectedDateStr, selectedStaffId, tenantId]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (serviceRef.current && !serviceRef.current.contains(event.target)) setIsServiceOpen(false);
      if (staffRef.current && !staffRef.current.contains(event.target)) setIsStaffOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleQuickEarliest = () => {
    const res = selectEarliestSlot();
    if (res.success) {
      const formattedDate = new Date(res.dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      setStatus({ text: `Earliest slot found: ${formattedDate} at ${res.slot.timeLabel}`, type: 'success' });
      
      if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
      statusTimerRef.current = setTimeout(() => setStatus({ text: '', type: '' }), 3500);
    } else {
      setStatus({ text: 'No available slots found for upcoming days.', type: 'error' });
    }
  };

  // 7. Обработка отправки (Создание или Перенос)
const handleSubmit = async (e) => {
  e.preventDefault();
  const token = localStorage.getItem('token');

  // --- ВАЛИДАЦИИ ФРОНТЕНДА ---
  if (!selectedSlot) {
    return setStatus({ text: 'Please select an available time slot.', type: 'error' });
  }

  if (selectedSlot.isDisabled || selectedSlot.isBooked) {
    return setStatus({ text: 'This time slot is already booked.', type: 'error' });
  }

  // Очищаем номер от пробелов для отправки на бэкенд
  const cleanPhone = clientPhone ? clientPhone.replace(/\s+/g, '') : '';

  // Если пользователь не залогинен, проверяем заполнение имени и телефона
  if (!token) {
    if (!clientName.trim()) {
      return setStatus({ text: 'Please enter your full name.', type: 'error' });
    }
    
    // Проверка международного формата E.164 (+1234567890)
    const e164Regex = /^\+[1-9]\d{6,14}$/;
    if (!cleanPhone || !e164Regex.test(cleanPhone)) {
      return setStatus({ 
        text: 'Please enter a valid international phone number (e.g. +1 234 567 8900)', 
        type: 'error' 
      });
    }
  }

  setStatus({ text: '', type: '' });
  setLoading(true);

  try {
    let userId;
    const finalTenantId = isValidMongoId(tenantId) ? tenantId : DEFAULT_TENANT_ID;

    // --- ПОЛУЧЕНИЕ / СОЗДАНИЕ ПОЛЬЗОВАТЕЛЯ ---
    if (token) {
      const meRes = await axios.get(`${API_URL}/users/me`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      userId = meRes.data._id || meRes.data.user?._id;
    } else {
      const userPayload = {
        tenantId: finalTenantId,
        name: clientName.trim(),
        phone: cleanPhone,
        role: 'client'
      };

      const userRes = await axios.post(`${API_URL}/users`, userPayload);
      userId = userRes.data.user?._id || userRes.data._id;
    }

    if (!isValidMongoId(userId)) {
      throw new Error('Unable to verify client ID. Please try again.');
    }

    // --- ПОДГОТОВКА ДАННЫХ ДЛЯ БРОНИРОВАНИЯ ---
    const finalServiceId = isValidMongoId(currentServiceObj?._id) 
      ? currentServiceObj?._id 
      : availableServices[0]?._id;

    const finalStaffId = isValidMongoId(currentStaffObj?._id) 
      ? currentStaffObj?._id 
      : availableStaff[0]?._id;

    const startIso = selectedSlot.startDate instanceof Date 
      ? selectedSlot.startDate.toISOString() 
      : new Date(selectedSlot.startDate).toISOString();

    const endIso = selectedSlot.endDate instanceof Date 
      ? selectedSlot.endDate.toISOString() 
      : new Date(selectedSlot.endDate).toISOString();

    let bookingRes;
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    // --- ОТПРАВКА ЗАПРОСА (СОЗДАНИЕ ИЛИ ПЕРЕНОС) ---
    if (activeRescheduleId) {
      const reschedulePayload = {
        startDatetime: startIso,
        endDatetime: endIso,
        serviceId: finalServiceId,
        staffId: finalStaffId
      };

      bookingRes = await axios.patch(
        `${API_URL}/bookings/${activeRescheduleId}/reschedule`, 
        reschedulePayload, 
        { headers }
      );
    } else {
      const bookingPayload = {
        tenantId: finalTenantId,
        serviceId: finalServiceId,
        staffId: finalStaffId,
        clientId: userId,
        startDatetime: startIso,
        endDatetime: endIso,
        phone: cleanPhone,
        comment: comment.trim(),
        paymentMethod,
        notifyTelegram
      };

      bookingRes = await axios.post(`${API_URL}/bookings`, bookingPayload, { headers });
    }

    const resData = bookingRes.data.booking || bookingRes.data;

    // --- ФОРМИРОВАНИЕ УСПЕШНОГО ЭКРАНА ---
    setCreatedBookingDetails({
      serviceTitle: currentServiceObj?.title || 'Selected Service',
      staffName: getBarberFullName(currentStaffObj) || 'Any Available Specialist',
      date: new Date(selectedDateStr).toLocaleDateString('en-US', { 
        weekday: 'short',
        month: 'short', 
        day: 'numeric' 
      }),
      time: selectedSlot.timeLabel,
      price: activePrice
    });

    if (onBookingSuccess) onBookingSuccess(resData);
    setIsSuccess(true);

  } catch (err) {
    // Расширенная обработка сообщений об ошибках с сервера
    const serverErrorMessage = 
      err.response?.data?.error || 
      err.response?.data?.message || 
      (Array.isArray(err.response?.data?.errors) ? err.response.data.errors[0]?.msg : null) ||
      err.message || 
      'Failed to complete booking. Please try again.';

    setStatus({ text: serverErrorMessage, type: 'error' });
  } finally {
    setLoading(false);
  }
};

  if (!isOpen) return null;

  return (
  <div 
    className="fixed inset-0 bg-stone-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 z-50 overflow-hidden select-none transition-all duration-300" 
    onClick={onClose}
  >
    <div 
      className="bg-stone-900 border border-amber-500/20 w-full max-w-xl rounded-[2.5rem] relative shadow-[0_0_50px_rgba(217,119,6,0.12)] transition-all max-h-[90vh] flex flex-col overflow-hidden text-stone-100" 
      onClick={(e) => e.stopPropagation()}
    >
      <div className="absolute -top-24 -left-24 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-60 h-60 bg-yellow-600/10 rounded-full blur-3xl pointer-events-none" />

      <button 
        onClick={onClose} 
        className="absolute top-6 right-6 w-9 h-9 rounded-2xl bg-stone-800/80 hover:bg-stone-700/80 text-stone-400 hover:text-amber-400 flex items-center justify-center transition-all active:scale-90 z-30 border border-stone-700/50"
      >
        <X size={18} />
      </button>

      {/* --- ФИКСИРОВАННЫЙ ХЭДЕР --- */}
      <div className="p-6 sm:p-8 pb-4 shrink-0 border-b border-stone-800/60 relative z-20">
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-amber-400 bg-amber-950/60 px-3 py-1 rounded-full border border-amber-500/30">
            <Sparkles size={11} className="text-amber-400 animate-pulse" /> Premium Booking
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] font-black tracking-wider uppercase text-amber-200/80 bg-stone-800/80 px-2.5 py-1 rounded-full border border-stone-700/60">
            <ShieldCheck size={11} className="text-amber-400" /> Instant Lock
          </span>
          {fetchingBookings && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-400/70 animate-pulse">
              <Loader2 size={10} className="animate-spin" /> Checking schedule...
            </span>
          )}
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-amber-100 tracking-tight font-serif">
          {isSuccess 
            ? (rescheduleBookingId ? 'Appointment Rescheduled' : 'Booking Confirmed') 
            : (rescheduleBookingId ? 'Reschedule Appointment' : 'Book Your Appointment')}
        </h2>
        {!isSuccess && <p className="text-xs text-stone-400 font-medium mt-0.5">Select service, specialist, and preferred time slot.</p>}
      </div>

      {/* --- ОСНОВНОЙ КОНТЕНТ (СКРОЛЛ) --- */}
      <div className="p-6 sm:p-8 py-4 overflow-y-auto flex-1 space-y-5 scrollbar-thin scrollbar-thumb-stone-800 relative z-10">
        {isSuccess ? (
          <BookingSuccess bookingDetails={createdBookingDetails} onClose={onClose} />
        ) : (
          <form id="booking-form" onSubmit={handleSubmit} className="space-y-5">
            
            {/* Уведомление об отдыхе мастера и автовыборе ближайшей даты */}
            {initialDate && (
              <div className="bg-amber-500/10 border border-amber-500/30 p-3.5 rounded-2xl text-xs text-amber-300 font-medium flex items-center gap-2.5">
                <span className="text-base">💡</span>
                <div>
                  {getBarberFullName(currentStaffObj) || 'Specialist'} is off today. Automatically selected nearest available date: <b className="text-amber-200">{selectedDateStr}</b>
                </div>
              </div>
            )}

            {status.text && (
              <div className={`p-3.5 rounded-2xl text-xs font-bold flex items-center justify-between gap-2 animate-in fade-in slide-in-from-top-2 ${
                status.type === 'success' 
                  ? 'bg-amber-950/80 text-amber-200 border border-amber-500/50 shadow-lg shadow-amber-950/30' 
                  : 'bg-rose-950/80 text-rose-300 border border-rose-800/60'
              }`}>
                <div className="flex items-center gap-2">
                  {status.type === 'success' ? <CheckCircle2 size={16} className="text-amber-400" /> : <AlertTriangle size={16} />} 
                  <span>{status.text}</span>
                </div>
              </div>
            )}

            {/* Селекторы Услуги и Специалиста */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="relative" ref={serviceRef}>
                <label className="block text-[11px] font-extrabold uppercase tracking-widest text-amber-400/90 mb-1.5 flex items-center gap-1.5">
                  <Scissors size={12} className="text-amber-400" /> Service
                </label>
                <button
                  type="button"
                  onClick={() => { setIsServiceOpen(!isServiceOpen); setIsStaffOpen(false); }}
                  className="w-full bg-stone-800/80 hover:bg-stone-800 border border-stone-700/80 rounded-2xl p-3 text-left flex items-center justify-between transition-all focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 active:scale-[0.99]"
                >
                  <div className="truncate pr-2">
                    <span className="text-xs font-extrabold text-stone-100 block truncate">{currentServiceObj?.title || 'Select Service'}</span>
                    <span className="text-[10px] font-semibold text-amber-400/80">${currentServiceObj?.price} • {currentServiceObj?.durationMinutes || currentServiceObj?.duration || 45} mins</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-stone-400 shrink-0 transition-transform duration-200 ${isServiceOpen ? 'rotate-180' : ''}`} />
                </button>

                {isServiceOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-stone-900 border border-amber-500/30 rounded-2xl shadow-2xl z-40 max-h-52 overflow-y-auto p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-150">
                    {availableServices.map((s) => {
                      const sId = s._id || s.id;
                      const isSelected = String(sId) === String(selectedServiceId);
                      return (
                        <div
                          key={sId}
                          onClick={() => {
                            setSelectedServiceId(sId);
                            if (setSelectedService) setSelectedService(sId);
                            setIsServiceOpen(false);
                            setSelectedSlot(null);
                          }}
                          className={`p-2.5 rounded-xl cursor-pointer flex items-center justify-between text-xs transition-all ${
                            isSelected ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-stone-950 font-black shadow-md shadow-amber-900/40' : 'hover:bg-stone-800/80 text-stone-200 font-medium'
                          }`}
                        >
                          <div className="truncate pr-2">
                            <div className="font-extrabold truncate">{s.title}</div>
                            <div className={`text-[10px] ${isSelected ? 'text-stone-900 font-semibold' : 'text-stone-400'}`}>
                              {s.durationMinutes || s.duration || 45} mins
                            </div>
                          </div>
                          <span className="font-black text-sm shrink-0">${s.price}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="relative" ref={staffRef}>
                <label className="block text-[11px] font-extrabold uppercase tracking-widest text-amber-400/90 mb-1.5 flex items-center gap-1.5">
                  <UserCheck size={12} className="text-amber-400" /> Specialist
                </label>
                <button
                  type="button"
                  onClick={() => { setIsStaffOpen(!isStaffOpen); setIsServiceOpen(false); }}
                  className="w-full bg-stone-800/80 hover:bg-stone-800 border border-stone-700/80 rounded-2xl p-3 text-left flex items-center justify-between transition-all focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 active:scale-[0.99]"
                >
                  <div className="flex items-center gap-2.5 truncate pr-2">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-600 to-yellow-500 text-stone-950 flex items-center justify-center font-black text-[10px] shrink-0 shadow-md">
                      {getBarberFullName(currentStaffObj)?.charAt(0) || 'B'}
                    </div>
                    <div className="truncate">
                      <span className="text-xs font-extrabold text-stone-100 block truncate">{getBarberFullName(currentStaffObj)}</span>
                      <span className="text-[10px] font-semibold text-stone-400">{getBarberRole(currentStaffObj)}</span>
                    </div>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-stone-400 shrink-0 transition-transform duration-200 ${isStaffOpen ? 'rotate-180' : ''}`} />
                </button>

                {isStaffOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-stone-900 border border-amber-500/30 rounded-2xl shadow-2xl z-40 max-h-52 overflow-y-auto p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-150">
                    {availableStaff.map((m) => {
                      const mId = m._id || m.id;
                      const isSelected = String(mId) === String(selectedStaffId);

                      const currentDate = (typeof date !== 'undefined' ? date : null) 
                                       || (typeof selectedDate !== 'undefined' ? selectedDate : null) 
                                       || (typeof bookingDate !== 'undefined' ? bookingDate : null) 
                                       || new Date();

                      const isWorking = isBarberWorkingOnDate(m, currentDate);
                      const isOff = (typeof isStaffOff === 'function' ? isStaffOff(m) : false) || !isWorking;

                      const fullName = getBarberFullName(m);
                      const roleName = getBarberRole(m);

                      return (
                        <div
                          key={mId}
                          onClick={() => { 
                            if (isOff) return;
                            setSelectedStaffId(mId); 
                            if (setSelectedStaff) setSelectedStaff(mId);
                            setIsStaffOpen(false); 
                            setSelectedSlot(null);
                          }}
                          className={`p-2.5 rounded-xl flex items-center justify-between text-xs transition-all ${
                            isOff ? 'opacity-40 cursor-not-allowed bg-stone-950/40' : 'cursor-pointer'
                          } ${
                            isSelected && !isOff
                              ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-stone-950 font-black shadow-md shadow-amber-900/40' 
                              : !isOff ? 'hover:bg-stone-800/80 text-stone-200 font-medium' : ''
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-[9px] ${
                              isSelected && !isOff ? 'bg-stone-950 text-amber-400' : 'bg-stone-800 text-amber-400/80 border border-amber-500/20'
                            }`}>
                              {fullName?.charAt(0)}
                            </div>
                            <div>
                              <div className="font-extrabold flex items-center gap-1.5">
                                <span>{fullName}</span>
                              </div>
                              <div className={`text-[10px] ${isSelected && !isOff ? 'text-stone-900 font-semibold' : 'text-stone-400'}`}>
                                {m.specialization || roleName}
                              </div>
                            </div>
                          </div>

                          {isOff && (
                            <span className="text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider bg-rose-950/90 text-rose-300 border border-rose-800/50">
                              DAY OFF
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <DateStrip datePills={datePills} selectedDateStr={selectedDateStr} onSelectDate={(date) => { setSelectedDateStr(date); setSelectedSlot(null); }} onQuickEarliest={handleQuickEarliest} />
            <TimeSlotsGrid generatedSlots={generatedSlots} selectedSlot={selectedSlot} onSelectSlot={setSelectedSlot} />

            {/* --- ДАННЫЕ КЛИЕНТА (Имя, Телефон, Комментарий) --- */}
            <div className="space-y-3 pt-2 border-t border-stone-800/60">
              <label className="block text-[11px] font-extrabold uppercase tracking-widest text-amber-400/90 flex items-center gap-1.5">
                <User size={12} className="text-amber-400" /> Client Details
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <input
                    type="text"
                    required
                    placeholder="Full Name *"
                    value={clientName || ''}
                    onChange={(e) => setClientName && setClientName(e.target.value)}
                    className="w-full bg-stone-800/80 border border-stone-700/80 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl p-3 text-xs text-stone-100 placeholder-stone-500 outline-none transition-all"
                  />
                </div>
                <div>
  <label className="block text-[11px] font-medium text-stone-400 mb-1">
    Phone Number *
  </label>
  <input
    type="tel"
    required
    placeholder="+1 234 567 8900"
    value={clientPhone || '+'}
    onChange={(e) => {
      if (setClientPhone) {
        // Пропускаем значение через функцию форматирования E.164
        const formatted = formatPhoneNumber(e.target.value);
        setClientPhone(formatted);
      }
    }}
    className="w-full bg-stone-800/80 border border-stone-700/80 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl p-3 text-xs text-stone-100 placeholder-stone-500 outline-none transition-all"
  />
</div>
              </div>

              {/* Поле для заметок / пожеланий */}
              {typeof clientNotes !== 'undefined' && setClientNotes && (
                <div>
                  <input
                    type="text"
                    placeholder="Special requests or notes (optional)"
                    value={clientNotes}
                    onChange={(e) => setClientNotes(e.target.value)}
                    className="w-full bg-stone-800/80 border border-stone-700/80 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl p-3 text-xs text-stone-100 placeholder-stone-500 outline-none transition-all"
                  />
                </div>
              )}
            </div>

            {/* Оплата и Уведомления */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="flex p-1 bg-stone-800/50 border border-stone-700/50 rounded-2xl flex-1">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('venue')}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black transition-all ${
                      paymentMethod === 'venue' ? 'bg-amber-500 text-stone-950 shadow-md' : 'text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    <Wallet size={14} /> Pay at Venue
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('online')}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black transition-all ${
                      paymentMethod === 'online' ? 'bg-amber-500 text-stone-950 shadow-md' : 'text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    <CreditCard size={14} /> Online Deposit
                  </button>
                </div>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-stone-300 hover:text-amber-300 transition-colors select-none">
                  <div className="relative flex items-center">
                    <input 
                      type="checkbox" 
                      checked={notifyTelegram} 
                      onChange={(e) => setNotifyTelegram(e.target.checked)}
                      className="peer sr-only"
                    />
                    <div className="w-9 h-5 bg-stone-700 rounded-full peer-checked:bg-amber-500 transition-colors"></div>
                    <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition-transform peer-checked:translate-x-4"></div>
                  </div>
                  <span className="flex items-center gap-1"><Sparkles size={12} className="text-amber-400" /> Telegram Alert</span>
                </label>
              </div>

              {paymentMethod === 'online' && (
                <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 animate-in fade-in slide-in-from-top-2">
                  <Info size={16} className="text-amber-400 shrink-0 mt-0.5" />
                  <p>
                    Secure your slot with a <strong>${depositAmount} deposit</strong>. The remaining <strong>${servicePrice - depositAmount}</strong> will be paid at the venue.
                  </p>
                </div>
              )}
            </div>
          </form>
        )}
      </div>

      {/* --- ФИКСИРОВАННЫЙ ФУТЕР --- */}
      {!isSuccess && (
        <div className="p-6 sm:p-8 pt-4 shrink-0 border-t border-stone-800/60 bg-stone-900/95 relative z-20 space-y-3">
          <div className="relative overflow-hidden p-3.5 bg-stone-800/80 border border-stone-700/50 rounded-2xl flex items-center justify-between shadow-inner">
            <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
            <div>
              <span className="text-[9px] uppercase font-black text-amber-500 tracking-widest block mb-0.5">Appointment Summary</span>
              <span className="text-xs font-bold text-stone-100 block truncate">
                {currentServiceObj?.title} <span className="text-stone-500 mx-1">•</span> {getBarberFullName(currentStaffObj)?.split(' ')[0]}
              </span>
              
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[9px] font-black text-stone-400 bg-stone-800 px-1.5 py-0.5 rounded">
                  {currentServiceObj?.durationMinutes || currentServiceObj?.duration || 45} MIN
                </span>
                {selectedSlot ? (
                  <span className="text-xs text-amber-400 font-bold flex items-center gap-1">
                    <Clock size={11} /> {selectedSlot.timeLabel}
                  </span>
                ) : (
                  <span className="text-[10px] text-rose-400 font-semibold italic flex items-center gap-1">
                    <AlertTriangle size={10} /> Time slot not selected
                  </span>
                )}
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="text-[9px] font-extrabold text-stone-500 uppercase tracking-wide block">
                {paymentMethod === 'online' ? 'Deposit Due' : 'Total Due'}
              </span>
              <span className="text-2xl font-black text-white block leading-none tracking-tighter">
                ${activePrice}
              </span>
            </div>
          </div>

          {/* --- Кнопка подтверждения --- */}
          <button 
            form="booking-form"
            type="submit" 
            disabled={loading || !selectedSlot || selectedSlot?.isDisabled}
            className={`
              group relative w-full h-12 px-6 rounded-xl font-medium text-sm
              flex items-center justify-center gap-2.5 overflow-hidden
              transition-all duration-300 ease-out active:scale-[0.98]
              
              bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600
              text-zinc-950 font-semibold shadow-lg shadow-orange-500/20
              
              hover:shadow-xl hover:shadow-orange-500/30 hover:brightness-110
              
              disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none 
              disabled:shadow-none disabled:brightness-100
            `}
          >
            <span className="absolute inset-0 w-full h-full bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />

            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin text-zinc-950" />
                <span className="tracking-wide">Processing...</span>
              </>
            ) : (
              <>
                <span className="relative z-10 tracking-wide">
                  {isRescheduleMode 
                    ? `Confirm Reschedule ($${activePrice})` 
                    : paymentMethod === 'online' 
                      ? `Pay Deposit ($${activePrice})` 
                      : `Confirm Booking ($${activePrice})`
                  }
                </span>
                <Check 
                  size={18} 
                  className="relative z-10 stroke-[2.5] transition-transform duration-300 group-hover:scale-110 group-hover:translate-x-0.5" 
                />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  </div>
);
}