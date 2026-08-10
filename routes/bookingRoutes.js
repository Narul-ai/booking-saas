const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// 1. Публичный роут для получения занятых слотов (для модалки на клиенте)
router.get('/', bookingController.getBookingsByTenant);

// 2. Создание брони
router.post('/', authMiddleware, bookingController.createBooking);

// 3. Защищенный роут для админки
router.get('/tenant/:tenantId', [authMiddleware, adminMiddleware], bookingController.getBookingsByTenant);

// 4. Отмена брони (твой старый)
router.patch('/:id/cancel', authMiddleware, bookingController.cancelBooking);

// 5. 🔥 НОВЫЙ: Универсальное обновление статуса (confirmed, completed, cancelled, pending)
router.patch('/:id/status', [authMiddleware, adminMiddleware], bookingController.updateBookingStatus);

// 6. 🚀 НОВЫЙ: Перенос записи на другую дату/время (Reschedule)
router.patch('/:id/reschedule', authMiddleware, bookingController.rescheduleBooking);

module.exports = router;