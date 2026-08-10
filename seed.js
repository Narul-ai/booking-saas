const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Service = require('./models/Service'); 
const User = require('./models/User');

// Подставь свою строку подключения к MongoDB (из .env файла)
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/твоя_база_данных';

// Сгенерируем валидный ObjectId для Tenant
const TENANT_ID = new mongoose.Types.ObjectId('67a5b30e875a7c8ce5664fa2');

async function seedData() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Подключено к базе данных...');

    // Очищаем старые данные (по желанию)
    await Service.deleteMany({ tenantId: TENANT_ID });
    await User.deleteMany({ tenantId: TENANT_ID });

    // 1. Добавляем услуги
    await Service.insertMany([
      { tenantId: TENANT_ID, title: 'Beard Trim & Styling', durationMinutes: 30, price: 3500 },
      { tenantId: TENANT_ID, title: 'Haircut & Beard Combo', durationMinutes: 60, price: 7500 },
      { tenantId: TENANT_ID, title: 'Kids Haircut', durationMinutes: 30, price: 4000 },
      { tenantId: TENANT_ID, title: 'Hot Towel Shave', durationMinutes: 45, price: 5000 }
    ]);

    // Хешируем пароль для админа
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);

    // 2. Добавляем Администратора и Мастеров
    await User.insertMany([
      {
        tenantId: TENANT_ID,
        name: 'Admin',
        email: 'admin@gmail.com',
        phone: '+77071112233',
        password: hashedPassword,
        role: 'admin'
      },
      { tenantId: TENANT_ID, name: 'Alex Riviera', phone: '+77072223344', role: 'staff' },
      { tenantId: TENANT_ID, name: 'David Miller', phone: '+77073334455', role: 'staff' },
      { tenantId: TENANT_ID, name: 'Marcus Vance', phone: '+77074445566', role: 'staff' }
    ]);

    console.log('Данные и админ (admin@gmail.com / admin123) успешно загружены!');
    process.exit();
  } catch (err) {
    console.error('Ошибка сидирования:', err);
    process.exit(1);
  }
}

seedData();