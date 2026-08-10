const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const User = require('../models/User'); // Подключаем User для проверки и обновления телефона
const { sendBookingNotification } = require('../services/telegram'); // Подключаем Telegram отправку

// Вспомогательная функция для безопасного форматирования данных под Telegram
const formatNotificationData = (booking, fallbackPhone) => {
  const clientName = booking.clientId?.name || booking.clientId?.email || 'Клиент';
  const clientPhone = booking.clientId?.phone || fallbackPhone || 'Не указан';
  const serviceTitle = booking.serviceId?.title || booking.serviceId?.name || 'Услуга';
  const staffName = booking.staffId?.name || 'Мастер';
  const price = booking.serviceId?.price || 0;

  const startDate = new Date(booking.startDatetime);
  const dateStr = startDate.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const timeSlot = startDate.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

  return {
    _id: booking._id,
    clientName: `${clientName} (Мастер: ${staffName})`,
    clientPhone,
    serviceTitle,
    dateStr,
    timeSlot,
    price
  };
};

// 1. Создать новую запись
exports.createBooking = async (req, res) => {
  try {
    const { tenantId, serviceId, staffId, startDatetime, endDatetime, phone } = req.body;
    const clientId = req.body.clientId || req.user?.id;

    // Проверка обязательных ID и дат
    if (!tenantId || !serviceId || !staffId || !clientId || !startDatetime || !endDatetime) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (
      !mongoose.Types.ObjectId.isValid(tenantId) ||
      !mongoose.Types.ObjectId.isValid(serviceId) ||
      !mongoose.Types.ObjectId.isValid(staffId) ||
      !mongoose.Types.ObjectId.isValid(clientId)
    ) {
      return res.status(400).json({ error: 'Invalid ID format provided' });
    }

    // Ищем клиента в базе
    const client = await User.findById(clientId);
    if (!client) {
      return res.status(404).json({ error: 'Client user not found' });
    }

    // Определяем телефон (из запроса или из профиля)
    const clientPhone = phone || client.phone;

    // ⛔ ЖЕСТКАЯ ПРОВЕРКА: забронировать без телефона НЕЛЬЗЯ
    if (!clientPhone || !clientPhone.trim()) {
      return res.status(400).json({ 
        error: 'Phone number is required to create a booking' 
      });
    }

    // Если у пользователя не было телефона в базе, но он его указал — сохраняем
    if (!client.phone && phone) {
      client.phone = phone.trim();
      await client.save();
    }

    const newStart = new Date(startDatetime);
    const newEnd = new Date(endDatetime);
    const now = new Date();

    if (isNaN(newStart.getTime()) || isNaN(newEnd.getTime())) {
      return res.status(400).json({ error: 'Invalid date format' });
    }

    if (newStart < now) {
      return res.status(400).json({ error: 'Cannot book appointment in the past' });
    }

    if (newEnd <= newStart) {
      return res.status(400).json({ error: 'End time must be after start time' });
    }

    // Проверка на пересечение слотов у барбера
    const overlappingBooking = await Booking.findOne({
      tenantId,
      staffId,
      status: { $ne: 'cancelled' },
      startDatetime: { $lt: newEnd },
      endDatetime: { $gt: newStart }
    });

    if (overlappingBooking) {
      return res.status(409).json({ 
        error: 'This barber is already booked for the selected time slot.' 
      });
    }

    // Создание записи
    const booking = new Booking({
      tenantId,
      serviceId,
      staffId,
      clientId,
      startDatetime: newStart,
      endDatetime: newEnd,
      status: 'confirmed'
    });

    await booking.save();
    await booking.populate(['serviceId', 'staffId', 'clientId']);

    // 🚀 Отправка уведомления в Telegram
    const adminChatId = process.env.ADMIN_TELEGRAM_CHAT_ID;
    if (adminChatId) {
      sendBookingNotification(adminChatId, formatNotificationData(booking, clientPhone), 'created');
    }

    return res.status(201).json({ message: 'Booking successfully created', booking });
  } catch (error) {
    console.error('Error in createBooking:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// 2. Получить записи заведения (для админки и модалок)
exports.getBookingsByTenant = async (req, res) => {
  try {
    const tenantId = req.params.tenantId || req.query.tenantId;
    const { staffId } = req.query;

    if (!tenantId || !mongoose.Types.ObjectId.isValid(tenantId)) {
      return res.status(400).json({ error: 'Invalid or missing tenantId format' });
    }

    const filter = { tenantId };

    // Для клиенского запроса по конкретному мастеру отфильтровываем отмененные
    if (staffId) {
      filter.status = { $ne: 'cancelled' };
      if (mongoose.Types.ObjectId.isValid(staffId)) {
        filter.staffId = staffId;
      }
    }

    const bookings = await Booking.find(filter)
      .populate('serviceId')
      .populate('staffId')
      .populate({
        path: 'clientId',
        select: 'name email phone role telegramUsername' // Явно подтягиваем phone
      })
      .sort({ startDatetime: -1 })
      .lean();

    return res.json(bookings);
  } catch (error) {
    console.error('Error in getBookingsByTenant:', error);
    return res.status(500).json({ error: 'Failed to fetch bookings' });
  }
};

// 3. Отменить запись по ID
exports.cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid booking ID' });
    }

    const bookingToCancel = await Booking.findById(id);

    if (!bookingToCancel) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const isOwner = bookingToCancel.clientId.toString() === req.user?.id;
    const isAdmin = req.user?.role === 'admin' || req.user?.role === 'superadmin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Access denied: You cannot cancel this booking' });
    }

    // Обновляем с использованием современной опции Mongoose 8+
    const booking = await Booking.findByIdAndUpdate(
      id,
      { status: 'cancelled' },
      { returnDocument: 'after' }
    )
      .populate('serviceId')
      .populate('staffId')
      .populate('clientId');

    // 🚀 Отправка уведомления об отмене в Telegram
    const adminChatId = process.env.ADMIN_TELEGRAM_CHAT_ID;
    if (adminChatId) {
      sendBookingNotification(adminChatId, formatNotificationData(booking), 'cancelled');
    }

    return res.json({ message: 'Booking cancelled successfully', booking });
  } catch (error) {
    console.error('Error in cancelBooking:', error);
    return res.status(500).json({ error: 'Failed to cancel booking' });
  }
};

// 4. Универсальное обновление статуса (pending, confirmed, completed, cancelled)
exports.updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid booking ID' });
    }

    const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
    if (!status || !validStatuses.includes(status.toLowerCase())) {
      return res.status(400).json({ 
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
      });
    }

    const booking = await Booking.findByIdAndUpdate(
      id,
      { status: status.toLowerCase() },
      { returnDocument: 'after' } // Используем современную опцию Mongoose 8+
    )
      .populate('serviceId')
      .populate('staffId')
      .populate('clientId');

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // 🚀 Если статус изменен на cancelled через админку — отправляем уведомление
    if (status.toLowerCase() === 'cancelled') {
      const adminChatId = process.env.ADMIN_TELEGRAM_CHAT_ID;
      if (adminChatId) {
        sendBookingNotification(adminChatId, formatNotificationData(booking), 'cancelled');
      }
    }

    return res.json({ 
      message: `Status updated to ${status}`, 
      booking 
    });
  } catch (error) {
    console.error('Error in updateBookingStatus:', error);
    return res.status(500).json({ error: 'Failed to update booking status' });
  }
};

// 5. Перенести запись на новое время (Reschedule)
exports.rescheduleBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { startDatetime, endDatetime } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid booking ID' });
    }

    if (!startDatetime || !endDatetime) {
      return res.status(400).json({ error: 'New start and end datetime are required' });
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const isOwner = booking.clientId.toString() === req.user?.id;
    const isAdmin = req.user?.role === 'admin' || req.user?.role === 'superadmin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Access denied: You cannot reschedule this booking' });
    }

    const newStart = new Date(startDatetime);
    const newEnd = new Date(endDatetime);

    if (newStart < new Date()) {
      return res.status(400).json({ error: 'Cannot reschedule to a past time' });
    }

    // Ищем нахлёст у того же мастера, исключая текущую бронь
    const overlappingBooking = await Booking.findOne({
      _id: { $ne: id },
      tenantId: booking.tenantId,
      staffId: booking.staffId,
      status: { $ne: 'cancelled' },
      startDatetime: { $lt: newEnd },
      endDatetime: { $gt: newStart }
    });

    if (overlappingBooking) {
      return res.status(409).json({ error: 'This time slot is already booked' });
    }

    booking.startDatetime = newStart;
    booking.endDatetime = newEnd;
    booking.status = 'confirmed';

    await booking.save();
    await booking.populate(['serviceId', 'staffId', 'clientId']);

    // 🚀 Отправка уведомления о переносе в Telegram
    const adminChatId = process.env.ADMIN_TELEGRAM_CHAT_ID;
    if (adminChatId) {
      sendBookingNotification(adminChatId, formatNotificationData(booking), 'rescheduled');
    }

    return res.json({ message: 'Booking rescheduled successfully', booking });
  } catch (error) {
    console.error('Error in rescheduleBooking:', error);
    return res.status(500).json({ error: 'Failed to reschedule booking' });
  }
};