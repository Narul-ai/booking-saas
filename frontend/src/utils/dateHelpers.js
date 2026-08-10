/**
 * Утилита для безопасной работы со статусом и графиком мастеров/персонала.
 */

// Карта соответствия различных форматов названий дней недели к 3-буквенному ENG стандарту
const DAY_ALIAS_MAP = {
  // English full & short
  sun: 'Sun', sunday: 'Sun',
  mon: 'Mon', monday: 'Mon',
  tue: 'Tue', tues: 'Tue', tuesday: 'Tue',
  wed: 'Wed', wednesday: 'Wed',
  thu: 'Thu', thur: 'Thu', thursday: 'Thu',
  fri: 'Fri', friday: 'Fri',
  sat: 'Sat', saturday: 'Sat',
  // Порядковые индексы (0 - Воскресенье, 1 - Понедельник...)
  '0': 'Sun', '1': 'Mon', '2': 'Tue', '3': 'Wed', '4': 'Thu', '5': 'Fri', '6': 'Sat'
};

/**
 * Приводит любую входящую дату или аргумент к стандартному 3-буквенному дню недели ('Mon', 'Tue' и т.д.)
 * @param {Date|string|number} [dateInput=new Date()]
 * @returns {string} Например: "Thu"
 */
export const getShortWeekday = (dateInput = new Date()) => {
  try {
    const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
    if (!isNaN(date.getTime())) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    }
  } catch (e) {
    // ignore error fallback
  }

  // Если передана просто строка "Monday", "mon" или число
  const cleaned = String(dateInput).trim().toLowerCase();
  return DAY_ALIAS_MAP[cleaned] || new Date().toLocaleDateString('en-US', { weekday: 'short' });
};

/**
 * Нормализует список рабочих дней мастера из любых возможных форматов в Set из коротких названий ['Mon', 'Tue']
 * @param {any} rawDays 
 * @returns {Set<string>}
 */
const normalizeWorkDays = (rawDays) => {
  const normalized = new Set();

  if (!rawDays) return normalized;

  // 1. Если это МАССИВ: ['Mon', 'Tue'] или [1, 2, 3] или [{ day: 'Mon' }]
  if (Array.isArray(rawDays)) {
    rawDays.forEach(item => {
      if (typeof item === 'string' || typeof item === 'number') {
        const key = String(item).trim().toLowerCase();
        if (DAY_ALIAS_MAP[key]) normalized.add(DAY_ALIAS_MAP[key]);
      } else if (item && typeof item === 'object') {
        const dayVal = item.day || item.name || item.weekday;
        if (dayVal) {
          const key = String(dayVal).trim().toLowerCase();
          if (DAY_ALIAS_MAP[key]) normalized.add(DAY_ALIAS_MAP[key]);
        }
      }
    });
    return normalized;
  }

  // 2. Если это ОБЪЕКТ: { mon: true, tue: false, Wed: true }
  if (typeof rawDays === 'object') {
    Object.entries(rawDays).forEach(([key, val]) => {
      if (Boolean(val)) {
        const cleanKey = key.trim().toLowerCase();
        if (DAY_ALIAS_MAP[cleanKey]) normalized.add(DAY_ALIAS_MAP[cleanKey]);
      }
    });
    return normalized;
  }

  // 3. Если это СТРОКА: "Mon, Tue, Wed" или "Mon-Fri"
  if (typeof rawDays === 'string') {
    const parts = rawDays.split(/[,;|/\s]+/);
    parts.forEach(part => {
      const cleanKey = part.trim().toLowerCase();
      if (DAY_ALIAS_MAP[cleanKey]) normalized.add(DAY_ALIAS_MAP[cleanKey]);
    });
    return normalized;
  }

  return normalized;
};

/**
 * ПРОВЕРКА: Работает ли мастер в указанную дату (по умолчанию — СЕГОДНЯ)
 * 
 * @param {Object} barber - Объект мастера (из props или state)
 * @param {Date|string|number} [targetDate=new Date()] - Дата для проверки
 * @returns {boolean}
 */
export const isBarberWorkingToday = (barber, targetDate = new Date()) => {
  if (!barber || typeof barber !== 'object') return false;

  // 1. Прямая проверка флагов выходного (любые варианты наименования поля из БД)
  const isExplicitlyOff = 
    barber.isOff === true ||
    barber.isDayOff === true ||
    barber.off === true ||
    barber.schedule?.isOff === true ||
    barber.status === 'off' ||
    barber.status === 'DAY OFF' ||
    barber.status === 'inactive' ||
    barber.isAvailable === false;

  if (isExplicitlyOff) return false;

  // 2. Извлекаем сырые данные о днях (проверяем все возможные варианты названий полей)
  const rawWorkDays = 
    barber.schedule?.workDays || 
    barber.workDays || 
    barber.schedule?.days || 
    barber.days ||
    barber.workingDays;

  // Если графика нет вообще, но и явного флага isOff не было — считаем мастера доступным
  if (rawWorkDays === undefined || rawWorkDays === null) {
    return true; 
  }

  // 3. Получаем целевой день недели и нормализованные дни работы
  const currentDay = getShortWeekday(targetDate);
  const activeDaysSet = normalizeWorkDays(rawWorkDays);

  // Если график был задан как пустой массив/объект — значит у мастера нет рабочих дней
  if (activeDaysSet.size === 0) {
    return false;
  }

  return activeDaysSet.has(currentDay);
};

/**
 * Дополнительная функция: Получить понятный текст статуса мастера
 */
export const getBarberStatusText = (barber, targetDate = new Date()) => {
  const working = isBarberWorkingToday(barber, targetDate);
  if (!working) return 'Off Today';
  return barber.workingHours || barber.schedule?.hours || 'Available Today';
};