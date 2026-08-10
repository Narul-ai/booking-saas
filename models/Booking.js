const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    tenantId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Tenant', 
      required: [true, 'Tenant ID обязателен'], 
      index: true 
    },
    serviceId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Service', 
      required: [true, 'Service ID обязателен'] 
    },
    staffId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: [true, 'Staff ID обязателен'], 
      index: true 
    },
    clientId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: [true, 'Client ID обязателен'], 
      index: true 
    },
    startDatetime: { 
      type: Date, 
      required: [true, 'Время начала обязательно'] 
    },
    endDatetime: { 
      type: Date, 
      required: [true, 'Время окончания обязательно'] 
    },
    status: { 
      type: String, 
      enum: {
        values: ['pending', 'confirmed', 'cancelled', 'completed'],
        message: 'Некорректный статус бронирования: {VALUE}'
      }, 
      default: 'pending',
      index: true
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Заметка не может превышать 500 символов'],
      default: ''
    },
    totalPrice: {
      type: Number,
      min: [0, 'Цена не может быть отрицательной']
    }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

/* ==========================================================================
   1. ИНДЕКСЫ ДЛЯ МАКСИМАЛЬНОЙ ПРОИЗВОДИТЕЛЬНОСТИ
   ========================================================================== */

// Ускоряет поиск конфликтов времени для конкретного мастера в рамках тенанта
bookingSchema.index({ tenantId: 1, staffId: 1, startDatetime: 1, endDatetime: 1, status: 1 });

// Ускоряет получение истории записей конкретного клиента
bookingSchema.index({ tenantId: 1, clientId: 1, startDatetime: -1 });

/* ==========================================================================
   2. ВИРТУАЛЬНЫЕ ПОЛЯ (VIRTUALS)
   ========================================================================== */

// Вычисляемая длительность услуги в минутах
bookingSchema.virtual('durationInMinutes').get(function () {
  if (this.startDatetime && this.endDatetime) {
    return Math.round((this.endDatetime - this.startDatetime) / (1000 * 60));
  }
  return 0;
});

// Проверка, актуальна ли еще запись или уже прошла
bookingSchema.virtual('isPast').get(function () {
  if (this.endDatetime) {
    return new Date() > this.endDatetime;
  }
  return false;
});

/* ==========================================================================
   3. MIDDLEWARE (ХУКИ ВАЛИДАЦИИ И ПРОВЕРКИ КОНФЛИКТОВ)
   ========================================================================== */

// Исправлено: Асинхронная валидация без устаревшего next()
bookingSchema.pre('validate', async function () {
  // 1. Валидация хронологии дат
  if (this.startDatetime && this.endDatetime && this.startDatetime >= this.endDatetime) {
    this.invalidate('endDatetime', 'Время окончания должно быть строго позже времени начала');
  }

  // 2. Валидация: Нельзя записаться в прошлое
  if (this.isNew && this.startDatetime && this.startDatetime < new Date()) {
    this.invalidate('startDatetime', 'Нельзя создать запись на прошедшее время');
  }

  // 3. БЛОКИРОВКА ДУБЛЕЙ: Проверка на пересечение слота у этого же мастера
  if (this.isModified('startDatetime') || this.isModified('endDatetime') || this.isModified('staffId')) {
    const hasConflict = await this.constructor.hasConflict({
      tenantId: this.tenantId,
      staffId: this.staffId,
      start: this.startDatetime,
      end: this.endDatetime,
      excludeBookingId: this._id
    });

    if (hasConflict) {
      this.invalidate('startDatetime', 'The selected time for this specialist is already booked.');
    }
  }
});

/* ==========================================================================
   4. СТАТИЧЕСКИЕ МЕТОДЫ (STATIC METHODS)
   ========================================================================== */

/**
 * Проверка наличия конфликта по времени у мастера
 * @param {Object} params - { tenantId, staffId, start, end, excludeBookingId }
 * @returns {Promise<boolean>} - true если есть нахлёст времени
 */
bookingSchema.statics.hasConflict = async function ({ tenantId, staffId, start, end, excludeBookingId = null }) {
  const query = {
    tenantId,
    staffId,
    status: { $nin: ['cancelled'] }, // Игнорируем отменённые брони
    startDatetime: { $lt: end },
    endDatetime: { $gt: start }
  };

  if (excludeBookingId) {
    query._id = { $ne: excludeBookingId };
  }

  const conflict = await this.findOne(query).select('_id').lean();
  return !!conflict;
};

module.exports = mongoose.model('Booking', bookingSchema);