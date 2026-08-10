const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema(
  {
    tenantId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Tenant', 
      required: [true, 'Tenant ID обязателен'], 
      index: true 
    },
    title: { 
      type: String, 
      required: [true, 'Название услуги обязательно'], 
      trim: true,
      minlength: [2, 'Название услуги должно содержать минимум 2 символа'],
      maxlength: [100, 'Название услуги не может превышать 100 символов']
    },
    description: { 
      type: String, 
      trim: true,
      maxlength: [500, 'Описание не может превышать 500 символов'],
      default: '' 
    },
    durationMinutes: { 
      type: Number, 
      required: [true, 'Укажите длительность услуги в минутах'], 
      min: [5, 'Минимальная длительность услуги — 5 минут'],
      max: [480, 'Длительность услуги не может превышать 8 часов (480 минут)'],
      default: 45
    },
    price: { 
      type: Number, 
      required: [true, 'Укажите цену услуги'], 
      min: [0, 'Цена не может быть отрицательной'] 
    },
    // Цена со скидкой (опционально)
    discountPrice: {
      type: Number,
      min: [0, 'Скидочная цена не может быть отрицательной'],
      validate: {
        validator: function (value) {
          // Скидочная цена должна быть меньше обычной
          return !value || value < this.price;
        },
        message: 'Скидочная цена ({VALUE}) должна быть меньше обычной цены'
      }
    },
    category: {
      type: String,
      enum: {
        values: ['haircut', 'beard', 'combo', 'styling', 'care', 'other'],
        message: 'Некорректная категория услуги: {VALUE}'
      },
      default: 'haircut',
      index: true
    },
    // Список айди мастеров, которые могут выполнять эту услугу (если пусто — могут все)
    allowedStaffIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    isActive: { 
      type: Boolean, 
      default: true,
      index: true 
    },
    sortOrder: {
      type: Number,
      default: 0 // Для кастомной сортировки в меню/клиентском веб-приложении
    }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

/* ==========================================================================
   1. ИНДЕКСЫ ДЛЯ ОПТИМИЗАЦИИ ВЫБОРКИ
   ========================================================================== */

// Для быстрого получения активного прейскуранта заведения по категориям и порядку
serviceSchema.index({ tenantId: 1, isActive: 1, category: 1, sortOrder: 1 });

// Текстовый индекс для поиска по услугам
serviceSchema.index({ title: 'text', description: 'text' });

/* ==========================================================================
   2. ВИРТУАЛЬНЫЕ ПОЛЯ (VIRTUALS)
   ========================================================================== */

// Человекочитаемый формат длительности (например, "1 ч 15 мин" или "45 мин")
serviceSchema.virtual('formattedDuration').get(function () {
  if (!this.durationMinutes) return '0 мин';
  const hours = Math.floor(this.durationMinutes / 60);
  const minutes = this.durationMinutes % 60;

  if (hours > 0 && minutes > 0) return `${hours} ч ${minutes} мин`;
  if (hours > 0) return `${hours} ч`;
  return `${minutes} мин`;
});

// Актуальная цена (учитывает скидочную, если она задана)
serviceSchema.virtual('effectivePrice').get(function () {
  return this.discountPrice && this.discountPrice < this.price ? this.discountPrice : this.price;
});

/* ==========================================================================
   3. МЕТОДЫ СХЕМЫ (STATIC METHODS)
   ========================================================================== */

/**
 * Получить весь активный прайс-лист для заведения, отсортированный по порядку
 */
serviceSchema.statics.getActiveCatalog = function (tenantId) {
  return this.find({ tenantId, isActive: true })
    .sort({ sortOrder: 1, createdAt: -1 })
    .lean();
};

module.exports = mongoose.model('Service', serviceSchema);