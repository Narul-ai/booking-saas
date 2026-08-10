import { useState, useMemo, useEffect, useCallback } from 'react';

// Хелпер для получения ISO даты YYYY-MM-DD в локальном часовом поясе
const getLocalDateString = (date = new Date()) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Надежный парсер любых дат в единый Timestamp (ms)
const parseTimestamp = (dateVal) => {
  if (!dateVal) return 0;
  if (dateVal instanceof Date) return dateVal.getTime();
  const t = new Date(dateVal).getTime();
  return isNaN(t) ? 0 : t;
};

export function useBookingSlots({ 
  currentServiceObj, 
  currentStaffObj, 
  existingBookings = [],
  bufferMinutes = 0,
  slotStepMinutes = 30
}) {
  const [selectedDateStr, setSelectedDateStr] = useState(() => getLocalDateString());
  const [selectedSlot, setSelectedSlot] = useState(null);

  // Сброс выбранного слота при изменении ключевых параметров
  useEffect(() => {
    setSelectedSlot(null);
  }, [currentServiceObj?._id, currentStaffObj?._id, selectedDateStr]);

  // 1. Генерация плашек дат (30 дней вперед + кастомный выбор)
  const datePills = useMemo(() => {
    const dates = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const DAYS_COUNT = 30;

    for (let i = 0; i < DAYS_COUNT; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      
      const isoDate = getLocalDateString(d);
      const dayName = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'short' });
      const dayNumber = d.getDate();
      const monthName = d.toLocaleDateString('en-US', { month: 'short' });

      dates.push({ isoDate, dayName, dayNumber, monthName, fullDate: d });
    }

    if (selectedDateStr && !dates.some(p => p.isoDate === selectedDateStr)) {
      const [year, month, day] = selectedDateStr.split('-').map(Number);
      const customD = new Date(year, month - 1, day);

      dates.push({
        isoDate: selectedDateStr,
        dayName: customD.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNumber: customD.getDate(),
        monthName: customD.toLocaleDateString('en-US', { month: 'short' }),
        fullDate: customD
      });
    }

    return dates;
  }, [selectedDateStr]);

  // 2. Генератор слотов для переданной даты и параметров
  // 2. Генератор слотов для переданной даты и параметров
  const calculateSlotsForDate = useCallback((dateStr) => {
    if (!currentServiceObj || !dateStr) return [];

    const duration = Number(currentServiceObj.durationMinutes || currentServiceObj.duration || 45);
    const totalOccupiedDuration = duration + Number(bufferMinutes || 0);
    const now = new Date();

    const workStartHour = currentStaffObj?.workHours?.start ?? 9;
    const workEndHour = currentStaffObj?.workHours?.end ?? 21;

    const [year, month, day] = dateStr.split('-').map(Number);
    
    const startOfDay = new Date(year, month - 1, day, workStartHour, 0, 0, 0);
    const endOfDay = new Date(year, month - 1, day, workEndHour, 0, 0, 0);

    const breakStart = currentStaffObj?.breakHours?.start ? new Date(year, month - 1, day, currentStaffObj.breakHours.start, 0) : null;
    const breakEnd = currentStaffObj?.breakHours?.end ? new Date(year, month - 1, day, currentStaffObj.breakHours.end, 0) : null;

    const targetStaffId = currentStaffObj?._id || currentStaffObj?.id ? String(currentStaffObj._id || currentStaffObj.id) : null;

    // ФИЛЬТРАЦИЯ АКТИВНЫХ БРОНЕЙ
    const activeBookings = existingBookings.filter(b => {
      if (!b) return false;

      // Игнорируем отменённые брони
      const status = String(b.status || '').toLowerCase();
      if (['cancelled', 'rejected', 'canceled', 'declined'].includes(status)) {
        return false;
      }

      // Проверка совпадения мастера по ID
      if (targetStaffId) {
        const bStaffId = b.staffId?._id 
          ? String(b.staffId._id) 
          : (b.staffId ? String(b.staffId) : (b.barberId ? String(b.barberId) : null));

        if (bStaffId && bStaffId !== targetStaffId) return false;
      }

      const bStart = parseTimestamp(b.startDatetime || b.startDate || b.date);
      const bDuration = Number(b.serviceId?.durationMinutes || b.serviceMinutes || b.duration || 60);
      const bEnd = b.endDatetime ? parseTimestamp(b.endDatetime) : (bStart + bDuration * 60000);

      return bStart < endOfDay.getTime() && bEnd > startOfDay.getTime();
    });

    const slots = [];
    let currentSlotStart = new Date(startOfDay);

    while (currentSlotStart < endOfDay) {
      const slotStartMs = currentSlotStart.getTime();
      const slotStepEndMs = slotStartMs + slotStepMinutes * 60000; // Конец конкретно этого слота (30 мин)
      const serviceEndMs = slotStartMs + duration * 60000;
      const slotEndWithBufferMs = slotStartMs + totalOccupiedDuration * 60000;

      const isPast = slotStartMs < now.getTime();
      const exceedsWorkHours = serviceEndMs > endOfDay.getTime();
      const overlapsBreak = breakStart && breakEnd && (slotStartMs < breakEnd.getTime() && serviceEndMs > breakStart.getTime());

      // 1. Проверяем, забронирован ли ИМЕННО ЭТОТ 30-минутный отрезок (для бейджа BOOKED)
      const isDirectlyBooked = activeBookings.some(b => {
        const bStart = parseTimestamp(b.startDatetime || b.startDate || b.date);
        const bDuration = Number(b.serviceId?.durationMinutes || b.serviceMinutes || b.duration || 60);
        const bEnd = b.endDatetime ? parseTimestamp(b.endDatetime) : (bStart + bDuration * 60000);

        return slotStartMs < bEnd && slotStepEndMs > bStart;
      });

      // 2. Проверяем, не влезает ли услуга выбранной длины из-за последующих броней
      const isOverlappingDuration = activeBookings.some(b => {
        const bStart = parseTimestamp(b.startDatetime || b.startDate || b.date);
        const bDuration = Number(b.serviceId?.durationMinutes || b.serviceMinutes || b.duration || 60);
        const bEnd = b.endDatetime ? parseTimestamp(b.endDatetime) : (bStart + bDuration * 60000);

        return slotStartMs < bEnd && slotEndWithBufferMs > bStart;
      });

      const isDisabled = isPast || exceedsWorkHours || isOverlappingDuration || overlapsBreak;

      let reason = null;
      if (isPast) reason = 'Past';
      else if (exceedsWorkHours) reason = 'Closing';
      else if (overlapsBreak) reason = 'Break';
      else if (isDirectlyBooked) reason = 'Booked'; // 👈 Только для реально забронированного времени!
      else if (isOverlappingDuration) reason = 'Unavailable'; // 👈 Для 12:30 (не влезает по времени)

      const timeLabel = currentSlotStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
      const timeLabel12 = currentSlotStart.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      const endTimeLabel = new Date(serviceEndMs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

      slots.push({
        timeLabel,
        timeLabel12,
        endTimeLabel,
        startDate: new Date(currentSlotStart),
        endDate: new Date(serviceEndMs),
        isBooked: isDirectlyBooked, // 👈 Честный флаг брони
        isPast,
        isDisabled,
        reason
      });

      currentSlotStart = new Date(slotStartMs + slotStepMinutes * 60000);
    }

    return slots;
  }, [currentServiceObj, currentStaffObj, existingBookings, bufferMinutes, slotStepMinutes]);

  const generatedSlots = useMemo(() => {
    return calculateSlotsForDate(selectedDateStr);
  }, [selectedDateStr, calculateSlotsForDate]);

  const selectEarliestSlot = useCallback(() => {
    let firstFree = generatedSlots.find(s => !s.isDisabled);
    
    if (firstFree) {
      setSelectedSlot(firstFree);
      return { success: true, slot: firstFree, dateStr: selectedDateStr };
    }

    for (const pill of datePills) {
      if (pill.isoDate === selectedDateStr) continue;

      const daySlots = calculateSlotsForDate(pill.isoDate);
      const freeInDay = daySlots.find(s => !s.isDisabled);

      if (freeInDay) {
        setSelectedDateStr(pill.isoDate);
        setSelectedSlot(freeInDay);
        return { success: true, slot: freeInDay, dateStr: pill.isoDate };
      }
    }

    return { success: false };
  }, [generatedSlots, datePills, selectedDateStr, calculateSlotsForDate]);

  return {
    selectedDateStr,
    setSelectedDateStr,
    selectedSlot,
    setSelectedSlot,
    datePills,
    generatedSlots,
    selectEarliestSlot
  };
}