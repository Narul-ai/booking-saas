const mongoose = require('mongoose');

// Схема рабочего дня
const workDaySchema = new mongoose.Schema(
  {
    isOpen: { type: Boolean, default: true },
    openTime: { type: String, default: '09:00' }, // Формат HH:mm
    closeTime: { type: String, default: '21:00' }  // Формат HH:mm
  },
  { _id: false }
);

const tenantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Название заведения обязательно'],
      trim: true,
      minlength: [2, 'Название заведения должно быть не менее 2 символов'],
      maxlength: [100, 'Название заведения не может быть длиннее 100 символов']
    },
    slug: {
      type: String,
      required: [true, 'Slug (URL-идентификатор) обязателен'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      match: [/^[a-z0-9-]+$/, 'Slug может содержать только строчные латинские буквы, цифры и дефисы']
    },
    phone: {
      type: String,
      trim: true,
      default: ''
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Некорректный формат email'],
      default: ''
    },
    address: {
      street: { type: String, default: '' },
      city: { type: String, default: '' },
      formatted: { type: String, default: '' }
    },
    currency: {
      type: String,
      default: 'USD',
      uppercase: true,
      enum: ['USD', 'EUR', 'KZT', 'RUB', 'GEL']
    },
    timezone: {
      type: String,
      default: 'Asia/Almaty'
    },
    // Настройки графика работы по дням недели
    workingHours: {
      monday: { type: workDaySchema, default: () => ({}) },
      tuesday: { type: workDaySchema, default: () => ({}) },
      wednesday: { type: workDaySchema, default: () => ({}) },
      thursday: { type: workDaySchema, default: () => ({}) },
      friday: { type: workDaySchema, default: () => ({}) },
      saturday: { type: workDaySchema, default: () => ({}) },
      sunday: { type: workDaySchema, default: () => ({ isOpen: false, openTime: '10:00', closeTime: '18:00' }) }
    },
    // Настройки бренда/стиля (для кастомизации UI)
    branding: {
      logoUrl: { type: String, default: '' },
      primaryColor: { type: String, default: '#f59e0b' }, // Amber-500
      accentColor: { type: String, default: '#18181b' }
    },
    status: {
      type: String,
      enum: ['active', 'suspended', 'trial'],
      default: 'active',
      index: true
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

/* ==========================================================================
   1. ИНДЕКСЫ
   ========================================================================== */

// Ускоряет поиск активных заведений по slug
tenantSchema.index({ slug: 1, status: 1 });

/* ==========================================================================
   2. ВИРТУАЛЬНЫЕ ПОЛЯ (VIRTUALS)
   ========================================================================== */

// Полный адрес одной строкой
tenantSchema.virtual('fullAddress').get(function () {
  if (this.address?.formatted) return this.address.formatted;
  if (this.address?.street && this.address?.city) return `${this.address.city}, ${this.address.street}`;
  return this.address?.street || this.address?.city || 'Адрес не указан';
});

// Проверка: открыто ли заведение прямиком в эту минуту
tenantSchema.virtual('isOpenNow').get(function () {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const now = new Date();
  const dayName = days[now.getDay()];
  const todaySchedule = this.workingHours?.[dayName];

  if (!todaySchedule || !todaySchedule.isOpen) return false;

  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const [openHours, openMins] = todaySchedule.openTime.split(':').map(Number);
  const [closeHours, closeMins] = todaySchedule.closeTime.split(':').map(Number);

  const startMinutes = openHours * 60 + openMins;
  const endMinutes = closeHours * 60 + closeMins;

  return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
});

/* ==========================================================================
   3. MIDDLEWARE (ХУКИ)
   ========================================================================== */

// Автоматическая генерация slug перед валидацией, если slug не передан явно
tenantSchema.pre('validate', function (next) {
  if (this.name && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');
  }
  next();
});

/* ==========================================================================
   4. СТАТИЧЕСКИЕ МЕТОДЫ
   ========================================================================== */

/**
 * Быстрый поиск заведения по slug
 */
tenantSchema.statics.findBySlug = function (slug) {
  return this.findOne({ slug: slug.toLowerCase(), status: 'active' });
};

module.exports = mongoose.model('Tenant', tenantSchema);