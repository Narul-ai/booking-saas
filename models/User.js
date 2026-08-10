const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Schema for Staff-specific details (Barbers)
// Schema for Staff-specific details (Barbers)
const staffProfileSchema = new mongoose.Schema(
  {
    title: { 
      type: String, 
      default: 'Barber', 
      trim: true 
    },
    bio: { 
      type: String, 
      default: '', 
      maxlength: [300, 'Bio cannot exceed 300 characters'] 
    },
    avatarUrl: { 
      type: String, 
      default: '' 
    },
    services: [{ 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Service' 
    }],
    rating: { 
      type: Number, 
      default: 5.0, 
      min: 1, 
      max: 5 
    },
    isAvailableForBooking: { 
      type: Boolean, 
      default: true 
    },
    // 💡 ДОБАВЛЯЕМ РАБОЧИЕ ДНИ МАСТЕРА
    workingDays: {
      type: [String],
      enum: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
      default: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] // по умолчанию работает без выходных
    }
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    tenantId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Tenant', 
      default: null, 
      index: true 
    },
    name: { 
      type: String, 
      required: [true, 'Name is required'], 
      trim: true,
      minlength: [2, 'Name must be at least 2 characters long'],
      maxlength: [60, 'Name cannot exceed 60 characters']
    },
    email: { 
      type: String, 
      lowercase: true, 
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
      default: null
    },
    password: {
      type: String,
      required: [
        function () { return this.role === 'admin' || this.role === 'superadmin'; },
        'Password is required for administrative accounts'
      ],
      minlength: [8, 'Password must be at least 8 characters long'],
      select: false // Never return password field in queries by default
    },
    phone: { 
      type: String, 
      required: false, 
      trim: true,
      index: true
    },
    role: { 
      type: String, 
      enum: {
        values: ['admin', 'staff', 'client', 'superadmin'],
        message: 'Invalid user role: {VALUE}'
      }, 
      default: 'client',
      index: true
    },
   telegramChatId: { 
  type: String, 
  default: null,
  unique: true,
  sparse: true // ⚠️ Обязательно! Иначе MongoDB выдаст ошибку E11000 при создании ВТОРОГО пользователя с null
},
    telegramUsername: {
      type: String,
      default: null,
      trim: true
    },
    staffProfile: {
      type: staffProfileSchema,
      default: function () {
        return this.role === 'staff' ? {} : undefined;
      }
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    lastLoginAt: {
      type: Date,
      default: null
    }
  },
  { 
    timestamps: true,
    toJSON: { 
      virtuals: true,
      transform: function (doc, ret) {
        delete ret.password;
        delete ret.__v;
        return ret;
      }
    },
    toObject: { virtuals: true }
  }
);

/* ==========================================================================
   1. INDEXES FOR PERFORMANCE & UNIQUE CONSTRAINTS
   ========================================================================== */
userSchema.index({ email: 1 }, { unique: true, sparse: true });
userSchema.index({ tenantId: 1, phone: 1 }, { unique: true, sparse: true });
userSchema.index({ tenantId: 1, role: 1, isActive: 1 });
userSchema.index({ tenantId: 1, telegramChatId: 1 });

/* ==========================================================================
   2. HOOKS & INSTANCE METHODS
   ========================================================================== */

// Automatic password hashing pre-save hook
// ✅ НОВОЕ (чистый async/await)
userSchema.pre('save', async function () {
  if (!this.isModified('password') || !this.password) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Helper instance method for checking password validity
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

/* ==========================================================================
   3. VIRTUALS & STATIC METHODS
   ========================================================================== */
userSchema.virtual('displayName').get(function () {
  if (this.role === 'staff' && this.staffProfile?.title) {
    return `${this.name} (${this.staffProfile.title})`;
  }
  return this.name;
});

userSchema.statics.getBarbers = function (tenantId) {
  return this.find({ 
    tenantId, 
    role: 'staff', 
    isActive: true,
    'staffProfile.isAvailableForBooking': true 
  })
  .select('name phone staffProfile')
  .populate('staffProfile.services', 'title price durationMinutes')
  .lean();
};

userSchema.statics.findOrCreateClient = async function ({ tenantId, name, phone, telegramChatId = null }) {
  let user = await this.findOne({ tenantId, phone });
  
  if (!user) {
    user = await this.create({
      tenantId,
      name,
      phone,
      role: 'client',
      telegramChatId
    });
  } else if (telegramChatId && !user.telegramChatId) {
    user.telegramChatId = telegramChatId;
    await user.save();
  }

  return user;
};

module.exports = mongoose.model('User', userSchema);