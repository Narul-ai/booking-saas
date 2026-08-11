const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_change_in_production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Настройка транспортера Nodemailer для отправки писем
const port = Number(process.env.SMTP_PORT) || 465;

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: port,
  secure: port === 465, // Автоматически true для 465, false для 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS ? process.env.SMTP_PASS.replace(/\s+/g, '') : '', // Автоматически убирает пробелы
  },
  tls: {
    rejectUnauthorized: false // Предотвращает блокировку по самоподписанным сертификатам
  }
});

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password.'
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists.'
      });
    }

    const userData = {
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: 'client'
    };

    const newUser = await User.create(userData);

    const token = jwt.sign(
      { id: newUser._id, role: newUser.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return res.status(201).json({
      success: true,
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      }
    });

  } catch (error) {
    console.error('[AUTH REGISTER ERROR]:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during registration process.'
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.'
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({ email: normalizedEmail }).select('+password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    user.lastLoginAt = new Date();
    await user.save();

    const token = jwt.sign(
      { id: user._id, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('[AUTH LOGIN ERROR]:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during authentication process.'
    });
  }
};

// Запрос на сброс пароля (Забыли пароль)
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an email address.'
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    // Защита от утечки данных: даже если юзер не найден, возвращаем 200 OK
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.'
      });
    }

    // 1. Генерация случайного сырого токена для ссылки
    const resetToken = crypto.randomBytes(32).toString('hex');

    // 2. Хэширование токена перед сохранением в базу (SHA256)
    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Время жизни токена — 15 минут
    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000;

    await user.save({ validateBeforeSave: false });

    // 3. Формирование URL ссылки для клиента
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const resetUrl = `${clientUrl}/reset-password/${resetToken}`;

    const mailOptions = {
      from: `"${process.env.APP_NAME || 'TopGun Barbershop'}" <${process.env.SMTP_USER}>`,
      to: user.email,
      subject: 'Password Reset Request',
      html: `
        <div style="font-family: Arial, sans-serif; background-color: #09090b; color: #f4f4f5; padding: 24px; border-radius: 12px;">
          <h2 style="color: #f59e0b; margin-bottom: 12px;">Password Reset Request</h2>
          <p style="font-size: 14px; color: #a1a1aa; line-height: 1.5;">
            You are receiving this email because you (or someone else) requested a password reset for your account.
          </p>
          <p style="font-size: 14px; color: #a1a1aa; line-height: 1.5;">
            Please click the button below to reset your password. This link is valid for <strong>15 minutes</strong>.
          </p>
          <div style="margin: 24px 0;">
            <a href="${resetUrl}" style="background-color: #f59e0b; color: #09090b; text-decoration: none; padding: 12px 24px; font-weight: bold; border-radius: 8px; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p style="font-size: 12px; color: #71717a;">
            If you did not request this, please ignore this email and your password will remain unchanged.
          </p>
        </div>
      `
    };

    try {
      await transporter.sendMail(mailOptions);
      return res.status(200).json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.'
      });
    } catch (sendError) {
      console.error('[EMAIL SEND ERROR]:', sendError);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });

      return res.status(500).json({
        success: false,
        message: 'Email could not be sent. Please check SMTP settings.'
      });
    }

  } catch (error) {
    console.error('[FORGOT PASSWORD ERROR]:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during password reset process.'
    });
  }
};

// Сброс пароля по токену из письма
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password || password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long.'
      });
    }

    // Хэшируем полученный из URL токен для сравнения с БД
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired password reset token.'
      });
    }

    // Устанавливаем новый пароль (захэшируется автоматически через pre('save'))
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Password has been reset successfully. You can now log in with your new password.'
    });

  } catch (error) {
    console.error('[RESET PASSWORD ERROR]:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during password reset process.'
    });
  }
};