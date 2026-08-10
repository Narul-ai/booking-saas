export const timeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

export const minutesToTime = (totalMinutes) => {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

/**
 * ГЕНЕРАТОР СВОБОДНЫХ ТАЙМ-СЛОТОВ С ЧЁТКИМ РАЗДЕЛЕНИЕМ BOOKED И UNAVAILABLE
 */
export const generateAvailableSlots = ({
  workStart = '09:00',
  workEnd = '21:00',
  serviceDuration = 45,
  existingBookings = [],
  slotInterval = 30
}) => {
  const startMinutes = timeToMinutes(workStart);
  const endMinutes = timeToMinutes(workEnd);

  // Переводим существующие записи в минуты
  const busyIntervals = existingBookings.map((b) => ({
    start: timeToMinutes(b.start),
    end: timeToMinutes(b.end)
  }));

  const slots = [];

  for (let current = startMinutes; current < endMinutes; current += slotInterval) {
    const slotStart = current;
    const slotEnd = current + slotInterval; // Конец конкретно этого 30-мин слота
    const potentialServiceEnd = current + serviceDuration; // Конец услуги, если начать в этот слот

    // 1. Проверяем, забронирован ли именно этот 30-минутный интервал напрямую
    const isBooked = busyIntervals.some((busy) => {
      return slotStart < busy.end && slotEnd > busy.start;
    });

    // 2. Проверяем, поместится ли услуга выбранной длительности, начиная с этого времени
    const isConflictingWithDuration = busyIntervals.some((busy) => {
      return slotStart < busy.end && potentialServiceEnd > busy.start;
    });

    // 3. Не выходит ли услуга за пределы рабочего дня
    const exceedsWorkDay = potentialServiceEnd > endMinutes;

    const isAvailable = !isBooked && !isConflictingWithDuration && !exceedsWorkDay;

    slots.push({
      time: minutesToTime(slotStart),
      endTime: minutesToTime(potentialServiceEnd),
      isBooked, // 👈 Передаем точный статус: забронировано ли время
      available: isAvailable // 👈 Можно ли кликнуть/выбрать для текущей услуги
    });
  }

  return slots;
};