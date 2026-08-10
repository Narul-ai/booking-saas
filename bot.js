const { Telegraf, Markup } = require('telegraf');
require('dotenv').config();

const token = process.env.TELEGRAM_BOT_TOKEN;
const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

if (!token) {
  console.error('❌ TELEGRAM_BOT_TOKEN не задан в .env файле!');
}

const bot = new Telegraf(token);

// Команда /start
bot.start((ctx) => {
  const firstName = ctx.from.first_name || 'Friend';

  ctx.replyWithMarkdownV2(
    `Welcome to *TOPGUN Barbershop*, *${firstName}*\\! 💈\n\n` +
    `Experience top\\-tier grooming and style\\. Book your appointment with our best barbers in just a few clicks\\.`,
    Markup.inlineKeyboard([
      [
        Markup.button.webApp('✂️ Book Now', clientUrl)
      ],
      [
        Markup.button.callback('📅 My Appointments', 'MY_BOOKINGS'),
        Markup.button.callback('📍 Location & Hours', 'LOCATION')
      ],
      [
        Markup.button.callback('💈 Services & Pricing', 'SERVICES'),
        Markup.button.callback('📞 Contact Us', 'CONTACT')
      ]
    ])
  );
});

// 1. Мои записи
bot.action('MY_BOOKINGS', async (ctx) => {
  await ctx.answerCbQuery();
  ctx.reply(
    'View or reschedule your upcoming appointments in your profile:',
    Markup.inlineKeyboard([
      Markup.button.webApp('👤 Open Profile', `${clientUrl}?modal=profile`)
    ])
  );
});

// 2. Локация
bot.action('LOCATION', async (ctx) => {
  await ctx.answerCbQuery();
  ctx.reply(
    '📍 *TOPGUN Barbershop*\n' +
    '🏢 *Address:* Shelek village, Central District\n' +
    '⏰ *Working Hours:* Everyday: 10:00 AM – 10:00 PM',
    { parse_mode: 'Markdown' }
  );
});

// 3. Услуги и цены
bot.action('SERVICES', async (ctx) => {
  await ctx.answerCbQuery();
  ctx.reply(
    '✂️ *Popular Services:*\n\n' +
    '• *Men\'s Haircut* — Premium cut & styling\n' +
    '• *Beard Trim & Care* — Hot towel & razor contour\n' +
    '• *Combo (Haircut + Beard)* — Complete look\n\n' +
    'Tap below to see full details and book:',
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        Markup.button.webApp('🔥 View Full Menu & Book', clientUrl)
      ])
    }
  );
});

// 4. Контакты
bot.action('CONTACT', async (ctx) => {
  await ctx.answerCbQuery();
  ctx.reply(
    '📞 *Need assistance?*\n\n' +
    'Phone: +7 (777) 000-00-00\n' +
    'Instagram: @topgun_shelek',
    { parse_mode: 'Markdown' }
  );
});

// Функция запуска
const startBot = () => {
  bot.launch()
    .then(() => console.log('🤖 TOPGUN Telegram Bot successfully started!'))
    .catch((err) => console.error('❌ Telegram Bot launch error:', err));

  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
};

module.exports = { startBot, bot };