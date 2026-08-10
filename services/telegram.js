const TelegramBot = require('node-telegram-bot-api').default || require('node-telegram-bot-api');
const cron = require('node-cron');
const Booking = require('../models/Booking');
const User = require('../models/User');

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  console.error('❌ TELEGRAM_BOT_TOKEN not found in .env');
}

process.env.NTBA_FIX_319 = 1;

// Define default business timezone for date & time formatting
const BUSINESS_TIMEZONE = process.env.TIMEZONE || 'Asia/Almaty';

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

console.log('🚀 Telegram Bot (Pro Version) successfully started!');

// Helper for safe message sending
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

// --- MAIN MENU ---
const getMainMenu = () => ({
  reply_markup: {
    keyboard: [
      [{ text: "📅 Today's Bookings" }, { text: "📆 Tomorrow's Bookings" }],
      [{ text: '📊 Financial Report' }, { text: '🆔 Get My Chat ID' }]
    ],
    resize_keyboard: true
  }
});

// Helper generating inline buttons for booking status management
const getBookingStatusButtons = (bookingId, currentStatus) => {
  const buttons = [];
  
  if (currentStatus !== 'confirmed') {
    buttons.push({ text: '✅ Confirm', callback_data: `status_confirmed_${bookingId}` });
  }
  if (currentStatus !== 'completed') {
    buttons.push({ text: '🎉 Complete', callback_data: `status_completed_${bookingId}` });
  }
  if (currentStatus !== 'cancelled') {
    buttons.push({ text: '❌ Cancel', callback_data: `status_cancelled_${bookingId}` });
  }

  return { inline_keyboard: [buttons] };
};

// --- 1. COMMAND /start ---
bot.onText(/\/start(?:\s+(.+))?/, async (msg, match) => {
  try {
    const chatId = msg.chat.id.toString();
    const firstName = msg.from.first_name || 'User';
    const startParam = match[1];

    if (startParam) {
      const user = await User.findById(startParam);
      if (user) {
        user.telegramChatId = chatId;
        await user.save();

        const welcomeText = 
          `✨ <b>Account successfully linked!</b>\n` +
          `━━━━━━━━━━━━━━━━━━━\n` +
          `👤 <b>User:</b> ${user.name}\n` +
          `💼 <b>Role:</b> <code>${user.role.toUpperCase()}</code>\n\n` +
          `🔔 <i>You will now receive all notifications about new bookings and updates in this chat.</i>`;

        await safeSendMessage(chatId, welcomeText, { parse_mode: 'HTML', ...getMainMenu() });
        return;
      }
    }

    const startText = 
      `👋 <b>Welcome, ${firstName}!</b>\n` +
      `━━━━━━━━━━━━━━━━━━━\n` +
      `Welcome to the <b>TopGun Barbershop</b> management panel 💈\n\n` +
      `Select a section from the interactive menu below to manage appointments and analytics.`;

    await safeSendMessage(chatId, startText, { parse_mode: 'HTML', ...getMainMenu() });
  } catch (err) {
    console.error('Error in /start:', err.message);
  }
});

// --- 2. MESSAGE AND TEXT COMMAND HANDLER ---
bot.on('message', async (msg) => {
  try {
    const chatId = msg.chat.id.toString();
    const text = msg.text?.trim();

    if (!text || text.startsWith('/')) return;

    if (text === '🆔 Get My Chat ID') {
      const idText = 
        `🔑 <b>Your Telegram Chat ID:</b>\n` +
        `<code>${chatId}</code>\n\n` +
        `<i>Use this ID to set up access permissions in the admin panel.</i>`;
      return await safeSendMessage(chatId, idText, { parse_mode: 'HTML' });
    }

    const currentUser = await User.findOne({ telegramChatId: chatId }).lean();

    // Bookings for Today / Tomorrow
    if (text === "📅 Today's Bookings" || text === "📆 Tomorrow's Bookings") {
      const isToday = text === "📅 Today's Bookings";

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
          `☕ <b>No bookings found</b>\nThere are no active bookings for ${isToday ? 'today' : 'tomorrow'}.`,
          { parse_mode: 'HTML' }
        );
      }

      let message = `📋 <b>Schedule for ${isToday ? 'Today' : 'Tomorrow'}:</b>\n━━━━━━━━━━━━━━━━━━━\n\n`;

      bookings.forEach((b, index) => {
        const clientName = b.clientId?.name || 'Client';
        const clientPhone = b.clientId?.phone || 'Not provided';
        const serviceName = b.serviceId?.title || b.serviceId?.name || 'Service';
        const staffName = b.staffId?.name || 'Barber';
        
        // Correct timezone conversion from UTC to local business timezone
        const time = new Date(b.startDatetime).toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit', 
          hour12: false, 
          timeZone: BUSINESS_TIMEZONE 
        });

        message += `<b>${index + 1}. ⏰ ${time}</b> — <b>${clientName}</b>\n`;
        message += `   ✂️ <i>${serviceName}</i>\n`;
        message += `   💈 Barber: <b>${staffName}</b>\n`;
        message += `   📞 Phone: <code>${clientPhone}</code>\n`;
        message += `───────────────\n`;
      });

      return await safeSendMessage(chatId, message, { parse_mode: 'HTML' });
    }

    // 📊 Financial Report
    if (text === '📊 Financial Report') {
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
        `📊 <b>TopGun Financial Report</b>\n` +
        `━━━━━━━━━━━━━━━━━━━\n\n` +
        `📈 <b>Today:</b>\n` +
        `  • Completed Visits: <code>${todayBookings.length}</code>\n` +
        `  • Revenue: <b>$${todayRevenue.toLocaleString()}</b>\n\n` +
        `📅 <b>This Month:</b>\n` +
        `  • Completed Visits: <code>${monthBookings.length}</code>\n` +
        `  • Revenue: <b>$${monthRevenue.toLocaleString()}</b>\n` +
        `━━━━━━━━━━━━━━━━━━━`;

      return await safeSendMessage(chatId, reportMessage, { parse_mode: 'HTML' });
    }

    // 🔍 Search and link account by phone number
    const cleanPhone = text.replace(/\D/g, '');
    if (cleanPhone.length >= 7) {
      const targetUser = await User.findOne({ phone: new RegExp(cleanPhone.slice(-10)) });

      if (targetUser && !targetUser.telegramChatId) {
        targetUser.telegramChatId = chatId;
        await targetUser.save();
        await safeSendMessage(
          chatId,
          `✅ <b>Account successfully linked!</b>\nUser: <b>${targetUser.name}</b> (<code>${targetUser.role}</code>)`,
          { parse_mode: 'HTML' }
        );
      }

      const clients = await User.find({ phone: new RegExp(cleanPhone, 'i') }).lean();

      if (!clients || clients.length === 0) {
        return await safeSendMessage(chatId, `🔍 User with phone number <code>${text}</code> not found.`, { parse_mode: 'HTML' });
      }

      const clientIds = clients.map((c) => c._id);
      const clientBookings = await Booking.find({ clientId: { $in: clientIds } })
        .populate('serviceId staffId')
        .sort({ startDatetime: -1 })
        .limit(5)
        .lean();

      if (clientBookings.length === 0) {
        return await safeSendMessage(chatId, `👤 Client <b>${clients[0].name}</b> found, but booking history is empty.`, { parse_mode: 'HTML' });
      }

      let historyMessage = 
        `🔎 <b>Client Visit History</b>\n` +
        `👤 <b>${clients[0].name}</b> (<code>${clients[0].phone}</code>)\n` +
        `━━━━━━━━━━━━━━━━━━━\n\n`;

      clientBookings.forEach((b, i) => {
        const dateStr = new Date(b.startDatetime).toLocaleDateString('en-US', { timeZone: BUSINESS_TIMEZONE });
        const timeStr = new Date(b.startDatetime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: BUSINESS_TIMEZONE });
        const serviceName = b.serviceId?.title || 'Service';
        const statusMap = { confirmed: '✅ Confirmed', completed: '🏁 Completed', cancelled: '❌ Cancelled' };

        historyMessage += `<b>${i + 1}. ${dateStr} at ${timeStr}</b>\n`;
        historyMessage += `   ✂️ ${serviceName}\n`;
        historyMessage += `   Status: ${statusMap[b.status] || b.status}\n`;
        historyMessage += `───────────────\n`;
      });

      return await safeSendMessage(chatId, historyMessage, { parse_mode: 'HTML' });
    }
  } catch (err) {
    console.error('Error processing message:', err.message);
  }
});

// --- 3. INLINE CALLBACK BUTTONS (Status Updates & Ratings) ---
bot.on('callback_query', async (query) => {
  try {
    const chatId = query.message.chat.id;
    const data = query.data;

    // A. Booking status update
    if (data.startsWith('status_')) {
      const [, newStatus, bookingId] = data.split('_');

      const existingBooking = await Booking.findById(bookingId).lean();
      if (!existingBooking) {
        return await bot.answerCallbackQuery(query.id, { text: 'Booking not found.' }).catch(() => {});
      }

      if (existingBooking.status === newStatus) {
        return await bot.answerCallbackQuery(query.id, { text: 'Status is already up to date.' }).catch(() => {});
      }

      const updatedBooking = await Booking.findByIdAndUpdate(
        bookingId, 
        { status: newStatus }, 
        { returnDocument: 'after' }
      ).populate('clientId staffId serviceId');

      const statusTitles = {
        confirmed: '✅ Confirmed',
        completed: '🏁 Completed',
        cancelled: '❌ Cancelled'
      };

      await bot.answerCallbackQuery(query.id, { text: `Status changed: ${statusTitles[newStatus] || newStatus}` }).catch(() => {});

      let baseText = query.message.text || '';
      baseText = baseText.split('\n\n📌 Current Status:')[0].split('\n\n📌 Текущий статус:')[0];

      const updatedText = `${baseText}\n\n📌 <b>Current Status:</b> ${statusTitles[newStatus] || newStatus}`;

      await bot.editMessageText(updatedText, {
        chat_id: chatId,
        message_id: query.message.message_id,
        parse_mode: 'HTML',
        reply_markup: getBookingStatusButtons(bookingId, newStatus)
      }).catch((e) => console.error('Error editing message:', e.message));

      if (newStatus === 'completed' && updatedBooking.clientId?.telegramChatId) {
        await sendRatingRequest(updatedBooking);
      }
    }

    // B. Handling Rating Callback (1-5 ⭐)
    if (data.startsWith('rate_')) {
      const [, rating, bookingId] = data.split('_');
      
      await Booking.findByIdAndUpdate(bookingId, { rating: Number(rating) });

      await bot.answerCallbackQuery(query.id, { text: `Thank you for your rating: ${rating}⭐!` }).catch(() => {});
      
      const thankYouText = 
        `🌟 <b>Thank you for your feedback!</b>\n` +
        `━━━━━━━━━━━━━━━━━━━\n` +
        `Your rating: <b>${rating} ⭐</b>\n\n` +
        `We value your trust and look forward to seeing you again at <b>TopGun Barbershop</b>! 💈`;

      await bot.editMessageText(thankYouText, {
        chat_id: chatId,
        message_id: query.message.message_id,
        parse_mode: 'HTML'
      }).catch((e) => console.error('Error editing rating:', e.message));
    }
  } catch (err) {
    if (!err.message.includes('message is not modified')) {
      console.error('Callback error:', err.message);
    }
  }
});

// --- 4. UNIFIED TELEGRAM NOTIFICATION FUNCTION ---
const sendBookingNotification = async (targetChatId, bookingData, type = 'created') => {
  if (!targetChatId) return;

  let title = '🎉 New Booking!';
  if (type === 'rescheduled') title = '🔄 Booking Rescheduled!';
  if (type === 'cancelled') title = '❌ Booking Cancelled!';

  const message =
    `<b>${title}</b>\n` +
    `━━━━━━━━━━━━━━━━━━━\n` +
    `👤 <b>Client:</b> ${bookingData.clientName}\n` +
    `📞 <b>Phone:</b> <code>${bookingData.clientPhone}</code>\n` +
    `✂️ <b>Service:</b> ${bookingData.serviceTitle}\n` +
    `🗓 <b>Date:</b> ${bookingData.dateStr}\n` +
    `⏰ <b>Time:</b> ${bookingData.timeSlot}\n` +
    `💰 <b>Price:</b> <b>$${bookingData.price}</b>\n` +
    `━━━━━━━━━━━━━━━━━━━`;

  const options = { 
    parse_mode: 'HTML',
    reply_markup: getBookingStatusButtons(bookingData._id, bookingData.status || 'pending')
  };

  try {
    await safeSendMessage(targetChatId, message, options);
  } catch (error) {
    console.error('Error sending Telegram message:', error.message);
  }
};

// --- 5. POST-VISIT RATING REQUEST FUNCTION ---
const sendRatingRequest = async (booking) => {
  const clientChatId = booking.clientId?.telegramChatId;
  if (!clientChatId) return;

  const staffName = booking.staffId?.name || 'your barber';
  const text = 
    `💈 <b>How was your visit?</b>\n` +
    `━━━━━━━━━━━━━━━━━━━\n` +
    `Please rate your experience with <b>${staffName}</b>:`;

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

// --- 6. CRON JOB: UPCOMING VISIT REMINDERS ---
cron.schedule('*/15 * * * *', async () => {
  try {
    const now = new Date();
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
        // Correct timezone conversion for cron job reminders
        const timeStr = new Date(booking.startDatetime).toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit', 
          hour12: false, 
          timeZone: BUSINESS_TIMEZONE 
        });
        
        const staffName = booking.staffId?.name || 'your barber';
        
        const reminderText = 
          `⏰ <b>Upcoming Visit Reminder!</b>\n` +
          `━━━━━━━━━━━━━━━━━━━\n` +
          `Reminder: You have an appointment today at <b>${timeStr}</b> at <b>TopGun Barbershop</b>.\n\n` +
          `💈 <b>Barber:</b> ${staffName}\n` +
          `✂️ <b>Service:</b> ${booking.serviceId?.title || 'Haircut'}\n\n` +
          `<i>We look forward to seeing you! Please contact us if your plans change.</i>`;

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
    console.error('Cron Job Error:', err.message);
  }
});

module.exports = { bot, sendBookingNotification, sendRatingRequest };