const TelegramBot = require('node-telegram-bot-api').default || require('node-telegram-bot-api');
const cron = require('node-cron');
const Booking = require('../models/Booking');
const User = require('../models/User');

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  console.error('❌ TELEGRAM_BOT_TOKEN не найден в .env');
}

process.env.NTBA_FIX_319 = 1;

const bot = new TelegramBot(token, {
  polling: {
    interval: 1000,
    autoStart: true,
    params: { timeout: 10 }
  },
  request: {
    agentOptions: {
      keepAlive: true,
      family: 4
    }
  }
});

bot.on('polling_error', () => {});

console.log('🚀 Telegram бот (Pro версии) успешно запущен!');

// Хелпер безопасной отправки сообщений
async function safeSendMessage(chatId, text, options = {}, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await bot.sendMessage(chatId, text, options);
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise((res) => setTimeout(res, 1000));
    }
  }
}

// --- ГЛАВНОЕ МЕНЮ ---
const getMainMenu = () => ({
  reply_markup: {
    keyboard: [
      [{ text: '📅 Записи на сегодня' }, { text: '📆 Записи на завтра' }],
      [{ text: '📊 Финансы и отчеты' }, { text: '🆔 Узнать мой Chat ID' }]
    ],
    resize_keyboard: true
  }
});

// Хелпер генерации инлайн-кнопок для управления записью
const getBookingStatusButtons = (bookingId, currentStatus) => {
  const buttons = [];
  
  if (currentStatus !== 'confirmed') {
    buttons.push({ text: '✅ Подтвердить', callback_data: `status_confirmed_${bookingId}` });
  }
  if (currentStatus !== 'completed') {
    buttons.push({ text: '🎉 Завершить', callback_data: `status_completed_${bookingId}` });
  }
  if (currentStatus !== 'cancelled') {
    buttons.push({ text: '❌ Отменить', callback_data: `status_cancelled_${bookingId}` });
  }

  return { inline_keyboard: [buttons] };
};

// --- 1. КОМАНДА /start ---
bot.onText(/\/start(?:\s+(.+))?/, async (msg, match) => {
  try {
    const chatId = msg.chat.id.toString();
    const firstName = msg.from.first_name || 'Пользователь';
    const startParam = match[1];

    if (startParam) {
      const user = await User.findById(startParam);
      if (user) {
        user.telegramChatId = chatId;
        await user.save();

        const welcomeText = 
          `✨ <b>Аккаунт успешно привязан!</b>\n` +
          `━━━━━━━━━━━━━━━━━━━\n` +
          `👤 <b>Пользователь:</b> ${user.name}\n` +
          `💼 <b>Роль в системе:</b> <code>${user.role.toUpperCase()}</code>\n\n` +
          `🔔 <i>Теперь все уведомления о новых бронированиях и изменениях будут поступать в этот чат.</i>`;

        await safeSendMessage(chatId, welcomeText, { parse_mode: 'HTML', ...getMainMenu() });
        return;
      }
    }

    const startText = 
      `👋 <b>Здравствуйте, ${firstName}!</b>\n` +
      `━━━━━━━━━━━━━━━━━━━\n` +
      `Добро пожаловать в панель управления <b>TopGun Barbershop</b> 💈\n\n` +
      `Выберите нужный раздел в интерактивном меню ниже для работы с записями и аналитикой.`;

    await safeSendMessage(chatId, startText, { parse_mode: 'HTML', ...getMainMenu() });
  } catch (err) {
    console.error('Ошибка в /start:', err.message);
  }
});

// --- 2. ОБРАБОТКА КНОПЕК И ТЕКСТОВЫХ ЗАПРОСОВ ---
bot.on('message', async (msg) => {
  try {
    const chatId = msg.chat.id.toString();
    const text = msg.text?.trim();

    if (!text || text.startsWith('/')) return;

    if (text === '🆔 Узнать мой Chat ID') {
      const idText = 
        `🔑 <b>Ваш идентификатор Telegram:</b>\n` +
        `<code>${chatId}</code>\n\n` +
        `<i>Используйте этот ID для настройки прав доступа в панели администратора.</i>`;
      return await safeSendMessage(chatId, idText, { parse_mode: 'HTML' });
    }

    const currentUser = await User.findOne({ telegramChatId: chatId }).lean();

    // Записи на Сегодня / Завтра (Универсальный расчет UTC)
    if (text === '📅 Записи на сегодня' || text === '📆 Записи на завтра') {
      const isToday = text === '📅 Записи на сегодня';

      const now = new Date();
      const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + (isToday ? 0 : 1), 0, 0, 0, 0));
      const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + (isToday ? 0 : 1), 23, 59, 59, 999));

      const filter = {
        startDatetime: { $gte: start, $lte: end },
        status: { $ne: 'cancelled' }
      };

      if (currentUser && currentUser.role === 'staff') {
        filter.staffId = currentUser._id;
      }

      const bookings = await Booking.find(filter)
        .populate('serviceId staffId clientId')
        .sort({ startDatetime: 1 })
        .lean();

      if (!bookings || bookings.length === 0) {
        return await safeSendMessage(
          chatId, 
          `☕ <b>Записи не найдены</b>\nНа ${isToday ? 'сегодня' : 'завтра'} активных бронирований пока нет.`,
          { parse_mode: 'HTML' }
        );
      }

      let message = `📋 <b>Расписание на ${isToday ? 'сегодня' : 'завтра'}:</b>\n━━━━━━━━━━━━━━━━━━━\n\n`;

      bookings.forEach((b, index) => {
        const clientName = b.clientId?.name || 'Клиент';
        const clientPhone = b.clientId?.phone || 'Не указан';
        const serviceName = b.serviceId?.title || b.serviceId?.name || 'Услуга';
        const staffName = b.staffId?.name || 'Мастер';
        const time = new Date(b.startDatetime).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });

        message += `<b>${index + 1}. ⏰ ${time}</b> — <b>${clientName}</b>\n`;
        message += `   ✂️ <i>${serviceName}</i>\n`;
        message += `   💈 Мастер: <b>${staffName}</b>\n`;
        message += `   📞 Тел: <code>${clientPhone}</code>\n`;
        message += `───────────────\n`;
      });

      return await safeSendMessage(chatId, message, { parse_mode: 'HTML' });
    }

    // 📊 Финансы и отчеты (Универсальный расчет UTC)
    if (text === '📊 Финансы и отчеты') {
      const now = new Date();
      const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
      const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));

      const todayBookings = await Booking.find({
        startDatetime: { $gte: startOfDay },
        status: 'completed'
      }).populate('serviceId').lean();

      const monthBookings = await Booking.find({
        startDatetime: { $gte: startOfMonth },
        status: 'completed'
      }).populate('serviceId').lean();

      const todayRevenue = todayBookings.reduce((sum, b) => sum + (b.serviceId?.price || 0), 0);
      const monthRevenue = monthBookings.reduce((sum, b) => sum + (b.serviceId?.price || 0), 0);

      const reportMessage =
        `📊 <b>Финансовый отчёт TopGun</b>\n` +
        `━━━━━━━━━━━━━━━━━━━\n\n` +
        `📈 <b>За сегодня:</b>\n` +
        `  • Завершено визитов: <code>${todayBookings.length}</code>\n` +
        `  • Выручка: <b>$${todayRevenue.toLocaleString()}</b>\n\n` +
        `📅 <b>За текущий месяц:</b>\n` +
        `  • Завершено визитов: <code>${monthBookings.length}</code>\n` +
        `  • Выручка: <b>$${monthRevenue.toLocaleString()}</b>\n` +
        `━━━━━━━━━━━━━━━━━━━`;

      return await safeSendMessage(chatId, reportMessage, { parse_mode: 'HTML' });
    }

    // 🔍 Поиск и привязка по номеру телефона
    const cleanPhone = text.replace(/\D/g, '');
    if (cleanPhone.length >= 7) {
      const targetUser = await User.findOne({ phone: new RegExp(cleanPhone.slice(-10)) });

      if (targetUser && !targetUser.telegramChatId) {
        targetUser.telegramChatId = chatId;
        await targetUser.save();
        await safeSendMessage(
          chatId,
          `✅ <b>Аккаунт успешно привязан!</b>\nПользователь: <b>${targetUser.name}</b> (<code>${targetUser.role}</code>)`,
          { parse_mode: 'HTML' }
        );
      }

      const clients = await User.find({ phone: new RegExp(cleanPhone, 'i') }).lean();

      if (!clients || clients.length === 0) {
        return await safeSendMessage(chatId, `🔍 Пользователь с номером <code>${text}</code> не найден.`, { parse_mode: 'HTML' });
      }

      const clientIds = clients.map((c) => c._id);
      const clientBookings = await Booking.find({ clientId: { $in: clientIds } })
        .populate('serviceId staffId')
        .sort({ startDatetime: -1 })
        .limit(5)
        .lean();

      if (clientBookings.length === 0) {
        return await safeSendMessage(chatId, `👤 Клиент <b>${clients[0].name}</b> найден, но история записей пуста.`, { parse_mode: 'HTML' });
      }

      let historyMessage = 
        `🔎 <b>История визитов клиента</b>\n` +
        `👤 <b>${clients[0].name}</b> (<code>${clients[0].phone}</code>)\n` +
        `━━━━━━━━━━━━━━━━━━━\n\n`;

      clientBookings.forEach((b, i) => {
        const dateStr = new Date(b.startDatetime).toLocaleDateString('ru-RU', { timeZone: 'UTC' });
        const timeStr = new Date(b.startDatetime).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
        const serviceName = b.serviceId?.title || 'Услуга';
        const statusMap = { confirmed: '✅ Подтверждена', completed: '🏁 Завершена', cancelled: '❌ Отменена' };

        historyMessage += `<b>${i + 1}. ${dateStr} в ${timeStr}</b>\n`;
        historyMessage += `   ✂️ ${serviceName}\n`;
        historyMessage += `   Статус: ${statusMap[b.status] || b.status}\n`;
        historyMessage += `───────────────\n`;
      });

      return await safeSendMessage(chatId, historyMessage, { parse_mode: 'HTML' });
    }
  } catch (err) {
    console.error('Ошибка обработки сообщения:', err.message);
  }
});

// --- 3. ИНЛАЙН КНОПКИ (Управление статусами и Оценка) ---
bot.on('callback_query', async (query) => {
  try {
    const chatId = query.message.chat.id;
    const data = query.data;

    // A. Изменение статуса бронирования
    if (data.startsWith('status_')) {
      const [, newStatus, bookingId] = data.split('_');

      const existingBooking = await Booking.findById(bookingId).lean();
      if (!existingBooking) {
        return await bot.answerCallbackQuery(query.id, { text: 'Запись не найдена.' }).catch(() => {});
      }

      if (existingBooking.status === newStatus) {
        return await bot.answerCallbackQuery(query.id, { text: 'Статус уже актуален.' }).catch(() => {});
      }

      const updatedBooking = await Booking.findByIdAndUpdate(
        bookingId, 
        { status: newStatus }, 
        { returnDocument: 'after' }
      ).populate('clientId staffId serviceId');

      const statusTitles = {
        confirmed: '✅ Подтверждена',
        completed: '🏁 Завершена',
        cancelled: '❌ Отменена'
      };

      await bot.answerCallbackQuery(query.id, { text: `Статус изменен: ${statusTitles[newStatus] || newStatus}` }).catch(() => {});

      let baseText = query.message.text || '';
      baseText = baseText.split('\n\n📌 Текущий статус:')[0];

      const updatedText = `${baseText}\n\n📌 <b>Текущий статус:</b> ${statusTitles[newStatus] || newStatus}`;

      await bot.editMessageText(updatedText, {
        chat_id: chatId,
        message_id: query.message.message_id,
        parse_mode: 'HTML',
        reply_markup: getBookingStatusButtons(bookingId, newStatus)
      }).catch((e) => console.error('Ошибка ред. сообщения:', e.message));

      if (newStatus === 'completed' && updatedBooking.clientId?.telegramChatId) {
        await sendRatingRequest(updatedBooking);
      }
    }

    // B. Обработка оценки клиентом (1-5 ⭐)
    if (data.startsWith('rate_')) {
      const [, rating, bookingId] = data.split('_');
      
      await Booking.findByIdAndUpdate(bookingId, { rating: Number(rating) });

      await bot.answerCallbackQuery(query.id, { text: `Спасибо за вашу оценку: ${rating}⭐!` }).catch(() => {});
      
      const thankYouText = 
        `🌟 <b>Спасибо за отзыв!</b>\n` +
        `━━━━━━━━━━━━━━━━━━━\n` +
        `Ваша оценка: <b>${rating} ⭐</b>\n\n` +
        `Мы ценят ваше доверие и всегда рады видеть вас в <b>TopGun Barbershop</b>! 💈`;

      await bot.editMessageText(thankYouText, {
        chat_id: chatId,
        message_id: query.message.message_id,
        parse_mode: 'HTML'
      }).catch((e) => console.error('Ошибка ред. оценки:', e.message));
    }
  } catch (err) {
    if (!err.message.includes('message is not modified')) {
      console.error('Ошибка callback:', err.message);
    }
  }
});

// --- 4. ЕДИНАЯ ФУНКЦИЯ УВЕДОМЛЕНИЙ В TELEGRAM ---
const sendBookingNotification = async (targetChatId, bookingData, type = 'created') => {
  if (!targetChatId) return;

  let title = '🎉 Новая запись!';
  if (type === 'rescheduled') title = '🔄 Запись перенесена!';
  if (type === 'cancelled') title = '❌ Запись отменена!';

  const message =
    `<b>${title}</b>\n` +
    `━━━━━━━━━━━━━━━━━━━\n` +
    `👤 <b>Клиент:</b> ${bookingData.clientName}\n` +
    `📞 <b>Телефон:</b> <code>${bookingData.clientPhone}</code>\n` +
    `✂️ <b>Услуга:</b> ${bookingData.serviceTitle}\n` +
    `🗓 <b>Дата:</b> ${bookingData.dateStr}\n` +
    `⏰ <b>Время:</b> ${bookingData.timeSlot}\n` +
    `💰 <b>Стоимость:</b> <b>$${bookingData.price}</b>\n` +
    `━━━━━━━━━━━━━━━━━━━`;

  const options = { 
    parse_mode: 'HTML',
    reply_markup: getBookingStatusButtons(bookingData._id, bookingData.status || 'pending')
  };

  try {
    await safeSendMessage(targetChatId, message, options);
  } catch (error) {
    console.error('Ошибка отправки в Telegram:', error.message);
  }
};

// --- 5. ФУНКЦИЯ ЗАПРОСА ОЦЕНКИ ПОСЛЕ ВИЗИТА ---
const sendRatingRequest = async (booking) => {
  const clientChatId = booking.clientId?.telegramChatId;
  if (!clientChatId) return;

  const staffName = booking.staffId?.name || 'вашего мастера';
  const text = 
    `💈 <b>Как прошёл ваш визит?</b>\n` +
    `━━━━━━━━━━━━━━━━━━━\n` +
    `Пожалуйста, оцените качество работы мастера <b>${staffName}</b>:`;

  const options = {
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [
          { text: '1 ⭐', callback_data: `rate_1_${booking._id}` },
          { text: '2 ⭐', callback_data: `rate_2_${booking._id}` },
          { text: '3 ⭐', callback_data: `rate_3_${booking._id}` },
          { text: '4 ⭐', callback_data: `rate_4_${booking._id}` },
          { text: '5 ⭐', callback_data: `rate_5_${booking._id}` }
        ]
      ]
    }
  };

  await safeSendMessage(clientChatId, text, options);
};

// --- 6. CRON JOB: ОПТИМИЗИРОВАННЫЕ НАПОМИНАНИЯ (Чистый UTC Timestamp) ---
cron.schedule('*/15 * * * *', async () => {
  try {
    const now = new Date();
    // Использование точного смещения в миллисекундах обеспечивает корректность UTC независимо от ОС сервера
    const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    const twoHoursAnd15Min = new Date(now.getTime() + (2 * 60 + 15) * 60 * 1000);

    const upcomingBookings = await Booking.find({
      startDatetime: { $gte: twoHoursLater, $lt: twoHoursAnd15Min },
      status: 'confirmed',
      reminderSent: { $ne: true }
    })
    .populate('clientId serviceId staffId')
    .lean();

    if (!upcomingBookings || upcomingBookings.length === 0) return;

    const notifiedIds = [];

    for (const booking of upcomingBookings) {
      if (booking.clientId?.telegramChatId) {
        const timeStr = new Date(booking.startDatetime).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
        const staffName = booking.staffId?.name || 'вашему мастеру';
        
        const reminderText = 
          `⏰ <b>Предстоящий визит!</b>\n` +
          `━━━━━━━━━━━━━━━━━━━\n` +
          `Напоминаем, что сегодня в <b>${timeStr}</b> у вас запланирована запись в <b>TopGun Barbershop</b>.\n\n` +
          `💈 <b>Мастер:</b> ${staffName}\n` +
          `✂️ <b>Услуга:</b> ${booking.serviceId?.title || 'Стрижка'}\n\n` +
          `<i>Ждём вас! Если планы изменились, пожалуйста, свяжитесь с нами.</i>`;

        await safeSendMessage(booking.clientId.telegramChatId, reminderText, { parse_mode: 'HTML' });
      }
      notifiedIds.push(booking._id);
    }

    if (notifiedIds.length > 0) {
      await Booking.updateMany(
        { _id: { $in: notifiedIds } },
        { $set: { reminderSent: true } }
      );
    }
  } catch (err) {
    console.error('Ошибка Cron Job:', err.message);
  }
});

module.exports = { bot, sendBookingNotification, sendRatingRequest };