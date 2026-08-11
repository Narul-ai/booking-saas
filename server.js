require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');

// Импортируем Telegram бота из папки services
require('./services/telegram');

// Models
const User = require('./models/User');

// Routes
const tenantRoutes = require('./routes/tenantRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const userRoutes = require('./routes/userRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();

// Global Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Security Header Adjustments
app.disable('x-powered-by');

// API Endpoints
app.use('/api/tenants', tenantRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/users', userRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/auth', authRoutes);

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

app.get('/', (req, res) => {
  res.send('SaaS Booking Platform API is running smoothly.');
});

// 404 Handler for Undefined Routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.originalUrl}`
  });
});

// Global Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// Default Superadmin Initialization Routine
const initSuperAdmin = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@gmail.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const adminName = process.env.ADMIN_NAME || 'Super Admin';

    const existingUser = await User.findOne({ email: adminEmail });
    
    if (!existingUser) {
      await User.create({
        name: adminName,
        email: adminEmail,
        password: adminPassword,
        role: 'admin',
        isActive: true
      });
      console.log(`[SEED] Superadmin initialized successfully: ${adminEmail}`);
    } else {
      console.log(`[SEED] Superadmin already exists: ${adminEmail}`);
    }
  } catch (error) {
    console.error('[SEED ERROR] Failed to initialize superadmin:', error.message);
  }
};

// Database Connection & Server Startup Function
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

const startServer = async () => {
  if (!MONGO_URI) {
    console.error('❌ CRITICAL ERROR: MONGO_URI environment variable is not defined in .env');
    process.exit(1);
  }

  try {
    // Подключаемся к базе с дополнительными опциями стабильности
    const conn = await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 5000, // Таймаут на поиск сервера 5 сек
      socketTimeoutMS: 45000,         // Закрывать сокеты после 45 сек неактивности
    });

    console.log(`✅ Successfully connected to MongoDB Database.`);
    console.log(`💻 Host: ${conn.connection.host}`);
    console.log(`🗄️ Database Name: ${conn.connection.name}`);

    // 🔧 Автоматическое удаление устаревших/конфликтных индексов
    try {
      await mongoose.connection.collection('users').dropIndex('telegramChatId_1');
      console.log('🗑️ Successfully dropped old telegramChatId_1 index.');
    } catch (indexErr) {
      console.log('ℹ️ Index telegramChatId_1 check completed.');
    }

    try {
      await mongoose.connection.collection('users').dropIndex('tenantId_1_phone_1');
      console.log('🗑️ Successfully dropped old tenantId_1_phone_1 index.');
    } catch (indexErr) {
      console.log('ℹ️ Index tenantId_1_phone_1 check completed.');
    }

    // Запуск начальной инициализации
    await initSuperAdmin();

    // Запуск сервера Express
    const server = app.listen(PORT, () => {
      console.log(`🚀 Server actively listening on port ${PORT} [Mode: ${process.env.NODE_ENV || 'development'}]`);
    });

    // Graceful Shutdown Handling (Корректное завершение работы)
    const handleShutdown = (signal) => {
      console.log(`\nReceived ${signal}. Shutting down server gracefully...`);
      server.close(async () => {
        try {
          await mongoose.connection.close();
          console.log('✅ MongoDB connection closed. Process exited successfully.');
          process.exit(0);
        } catch (err) {
          console.error('❌ Error during MongoDB disconnection:', err);
          process.exit(1);
        }
      });
    };

    process.on('SIGTERM', () => handleShutdown('SIGTERM'));
    process.on('SIGINT', () => handleShutdown('SIGINT'));

  } catch (err) {
    console.error(`❌ MongoDB Connection Failure: ${err.message}`);
    process.exit(1);
  }
};

// Запуск инициализации
startServer();