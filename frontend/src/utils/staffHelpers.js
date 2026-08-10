// src/utils/staffHelpers.js

// Дни недели: 0 - Воскресенье, 1 - Понедельник, 2 - Вторник, 3 - Среда, 4 - Четверг, 5 - Пятница, 6 - Суббота

export const ALL_STAFF = [
  {
    _id: '1',
    firstName: 'Alex',
    lastName: 'Turner',
    role: 'JUNIOR BARBER',
    specialization: 'Fades & Modern Styling',
    rating: '4.7',
    reviewsCount: 92,
    workingDays: [1, 2, 3, 4, 5] 
  },
  {
    _id: '2',
    firstName: 'Daniel',
    lastName: 'Vance',
    role: 'TOP SPECIALIST',
    specialization: 'Beard Sculpting & Hot Towel',
    rating: '5.0',
    reviewsCount: 123,
    workingDays: [1, 3, 5, 0] 
  },
  {
    _id: '3',
    firstName: 'Marcus',
    lastName: 'Hayes',
    role: 'SENIOR BARBER',
    specialization: 'Classic Cuts & Razor Shave',
    rating: '4.9',
    reviewsCount: 154,
    workingDays: [1, 2, 4, 5, 6] 
  },
  {
    _id: '4',
    firstName: 'Leo',
    lastName: 'Miller',
    role: 'MASTER BARBER',
    specialization: 'Full Grooming & Precision',
    rating: '4.8',
    reviewsCount: 185,
    workingDays: [2, 4, 6, 0] 
  },
  {
    _id: '5',
    firstName: 'Alex',
    lastName: 'Riviera',
    role: 'JUNIOR BARBER',
    specialization: 'Fades & Modern Styling',
    rating: '4.7',
    reviewsCount: 216,
    workingDays: [2, 3, 4, 5, 6, 0] 
  },
  {
    _id: '6',
    firstName: 'David',
    lastName: 'Miller',
    role: 'TOP SPECIALIST',
    specialization: 'Beard Sculpting & Hot Towel',
    rating: '5.0',
    reviewsCount: 247,
    workingDays: [2, 4, 6]  
  },
  {
    _id: '7',
    firstName: 'Marcus',
    lastName: 'Vance',
    role: 'SENIOR BARBER',
    specialization: 'Classic Cuts & Razor Shave',
    rating: '4.9',
    reviewsCount: 278,
    workingDays: [2, 3, 5, 6, 0]
  },
  {
    _id: '8',
    firstName: 'Julian',
    lastName: 'Hayes',
    role: 'MASTER BARBER',
    specialization: 'Full Grooming & Precision',
    rating: '4.8',
    reviewsCount: 309,
    workingDays: [1, 3, 5, 6]
  }
];

// Проверка на валидный MongoDB ObjectId (24 HEX символа)
export const isValidMongoId = (id) => {
  return typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);
};

// Функция получения полного имени
export const getBarberFullName = (barber) => {
  if (!barber) return 'Master Barber';
  if (typeof barber === 'string') return barber;
  if (barber.name) return barber.name;
  if (barber.fullName) return barber.fullName;
  return `${barber.firstName || ''} ${barber.lastName || ''}`.trim() || 'Master Barber';
};

// Функция получения роли / должности мастера
export const getBarberRole = (barber) => {
  if (!barber || typeof barber === 'string') return 'Barber';
  return barber.role || barber.position || barber.title || 'Barber';
};

// Проверка: работает ли мастер в выбранную дату
// Проверка: работает ли мастер в выбранную дату
// utils/staffHelpers.js

export function isBarberWorkingOnDate(barber, dateInput) {
  if (!barber || !dateInput) return true;

  // Достаем массив дней (работает и если передали объект User, и если просто staffProfile)
  const workingDays = barber.staffProfile?.workingDays || barber.workingDays;

  // Если массива нет или он пустой — считаем мастера доступным
  if (!Array.isArray(workingDays) || workingDays.length === 0) {
    return true;
  }

  const dateObj = new Date(dateInput);
  if (isNaN(dateObj.getTime())) return true;

  // 0 - Воскресенье, 1 - Понедельник, ..., 5 - Пятница, 6 - Суббота
  const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const currentDayName = dayNames[dateObj.getDay()];

  // Проверяем, есть ли день в графике
  return workingDays.some(day => String(day).toLowerCase() === currentDayName);
}


// Форматирование номера телефона в формат +7 (XXX) XXX-XX-XX
export const formatPhone = (value) => {
  if (!value) return '';
  let digits = value.replace(/\D/g, '');
  if (digits.startsWith('7') || digits.startsWith('8')) digits = digits.slice(1);
  digits = digits.slice(0, 10);

  if (digits.length === 0) return '+7 ';
  if (digits.length <= 3) return `+7 (${digits}`;
  if (digits.length <= 6) return `+7 (${digits.slice(0, 3)}) ${digits.slice(3)}`;
  if (digits.length <= 8) return `+7 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  return `+7 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 8)}-${digits.slice(8, 10)}`;
};