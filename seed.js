require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Service = require('./models/Service'); 
const User = require('./models/User');
const Tenant = require('./models/Tenant');

const MONGO_URI = process.env.MONGO_URI;

// Валидные ObjectId для Tenant и ключевых сотрудников
const TENANT_ID = new mongoose.Types.ObjectId('67a5b30e875a7c8ce5664fa2');
const STAFF_ID_1 = new mongoose.Types.ObjectId('6a65b30e875a7c8ce5664fa2');

async function seedData() {
  if (!MONGO_URI) {
    console.error('❌ MONGO_URI не найден в .env');
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGO_URI);
    console.log('📡 Подключено к базе данных (Atlas)...');

    // 1. Очищаем старые данные
    await Tenant.deleteMany({ _id: TENANT_ID });
    await Service.deleteMany({ tenantId: TENANT_ID });
    await User.deleteMany({}); // Полная очистка юзеров исключает конфликты с прошлыми дублями
    console.log('🧹 Старые данные очищены...');

    // 2. Создаем Салон (Tenant)
    await Tenant.create({
      _id: TENANT_ID,
      name: 'TopGun Barbershop',
      slug: 'topgun',
      isActive: true
    });
    console.log('✅ Салон TopGun создался!');

    // 3. Добавляем услуги
    await Service.insertMany([
      { tenantId: TENANT_ID, title: 'Beard Trim & Styling', durationMinutes: 30, price: 3500 },
      { tenantId: TENANT_ID, title: 'Haircut & Beard Combo', durationMinutes: 60, price: 7500 },
      { tenantId: TENANT_ID, title: 'Kids Haircut', durationMinutes: 30, price: 4000 },
      { tenantId: TENANT_ID, title: 'Hot Towel Shave', durationMinutes: 45, price: 5000 }
    ]);
    console.log('✅ Услуги добавились!');

    // Хешируем пароль для админа
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);

    // 4. Добавляем Администратора и Мастеров с явно заданными telegramChatId
    // 4. Добавляем Администратора и Мастеров с явно заданными email и telegramChatId
await User.insertMany([
  {
    tenantId: TENANT_ID,
    name: 'Admin',
    email: 'admin@gmail.com',
    phone: '+77071112233',
    password: hashedPassword,
    role: 'admin',
    telegramChatId: '100001'
  },
  { 
    _id: STAFF_ID_1,
    tenantId: TENANT_ID, 
    name: 'Alex Riviera', 
    email: 'alex@topgun.com', // <-- Уникальный email
    phone: '+77072223344', 
    role: 'staff',
    telegramChatId: '100002'
  },
  { 
    tenantId: TENANT_ID, 
    name: 'David Miller', 
    email: 'david@topgun.com', // <-- Уникальный email
    phone: '+77073334455', 
    role: 'staff',
    telegramChatId: '100003'
  },
  { 
    tenantId: TENANT_ID, 
    name: 'Marcus Vance', 
    email: 'marcus@topgun.com', // <-- Уникальный email
    phone: '+77074445566', 
    role: 'staff',
    telegramChatId: '100004'
  }
]);
    console.log('✅ Пользователи и мастера добавились!');

    console.log('🎉 База Atlas успешно наполнена данными!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Ошибка сидирования:', err);
    process.exit(1);
  }
}

seedData();