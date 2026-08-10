const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

// Вспомогательная функция генерации JWT
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role, tenantId: user.tenantId }, 
    JWT_SECRET, 
    { expiresIn: '30d' }
  );
};

// 1. РЕГИСТРАЦИЯ ПОЛЬЗОВАТЕЛЯ
exports.registerUser = async (req, res) => {
  try {
    const { tenantId, name, phone, email, password, role, telegramChatId } = req.body;

    if (!name || (!phone && !email)) {
      return res.status(400).json({ message: 'Имя и хотя бы один контакт (телефон или email) обязательны' });
    }

    const cleanEmail = email ? email.toLowerCase().trim() : undefined;
    const cleanPhone = phone ? phone.trim() : undefined;

    if (cleanEmail || cleanPhone) {
      const existingUser = await User.findOne({
        $or: [
          ...(cleanEmail ? [{ email: cleanEmail }] : []),
          ...(cleanPhone ? [{ phone: cleanPhone }] : [])
        ]
      });

      if (existingUser) {
        return res.status(400).json({ message: 'Пользователь с таким email или телефоном уже существует' });
      }
    }

    let hashedPassword = undefined;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(password, salt);
    }

    const validTenantId = (tenantId && mongoose.Types.ObjectId.isValid(tenantId)) ? tenantId : null;

    const user = new User({
      tenantId: validTenantId,
      name: name.trim(),
      phone: cleanPhone,
      email: cleanEmail,
      password: hashedPassword,
      role: role || 'client',
      telegramChatId: telegramChatId || null
    });

    await user.save();

    const token = generateToken(user);
    const userResponse = user.toObject();
    delete userResponse.password;

    return res.status(201).json({ 
      message: 'Пользователь успешно зарегистрирован', 
      token, 
      user: userResponse 
    });

  } catch (error) {
    console.error('Error in registerUser:', error);

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0] || 'поле';
      return res.status(400).json({ message: `Пользователь с таким ${field} уже существует` });
    }

    return res.status(500).json({ message: 'Ошибка сервера при регистрации', error: error.message });
  }
};

// 2. ВХОД В СИСТЕМУ (АВТОРИЗАЦИЯ)
exports.loginUser = async (req, res) => {
  try {
    const { login, email, phone, password } = req.body;
    const identifier = (login || email || phone || '').trim();

    if (!identifier || !password) {
      return res.status(400).json({ message: 'Введите логин/email/телефон и пароль' });
    }

    const user = await User.findOne({
      $or: [
        { phone: identifier }, 
        { email: identifier.toLowerCase() }
      ]
    });

    if (!user || !user.password) {
      return res.status(401).json({ message: 'Неверный логин или пароль' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Неверный логин или пароль' });
    }

    const token = generateToken(user);
    const userResponse = user.toObject();
    delete userResponse.password;

    return res.json({ 
      message: 'Авторизация успешна', 
      token, 
      user: userResponse 
    });

  } catch (error) {
    console.error('Error in loginUser:', error);
    return res.status(500).json({ message: 'Ошибка сервера при входе', error: error.message });
  }
};

// 3. ПОЛУЧЕНИЕ ТЕКУЩЕГО ПОЛЬЗОВАТЕЛЯ
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password -__v').lean();
    if (!user) return res.status(404).json({ message: 'Пользователь не найден' });
    return res.json(user);
  } catch (error) {
    console.error('Error in getCurrentUser:', error);
    return res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
};

// 4. ПОЛУЧЕНИЕ СОТРУДНИКОВ ТЕНАНТА
exports.getStaffByTenant = async (req, res) => {
  try {
    const { tenantId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(tenantId)) {
      return res.status(400).json({ message: 'Неверный формат tenantId' });
    }

    const staff = await User.find({ tenantId, role: { $in: ['staff', 'admin'] } })
      .select('-password -__v')
      .lean();

    return res.json(staff);
  } catch (error) {
    console.error('Error in getStaffByTenant:', error);
    return res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
};

// 5. ПОЛУЧЕНИЕ ВСЕХ ПОЛЬЗОВАТЕЛЕЙ ТЕНАНТА
exports.getUsersByTenant = async (req, res) => {
  try {
    const { tenantId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(tenantId)) {
      return res.status(400).json({ message: 'Неверный формат tenantId' });
    }

    const users = await User.find({ tenantId })
      .select('-password -__v')
      .sort({ createdAt: -1 })
      .lean();

    return res.json(users);
  } catch (error) {
    console.error('Error in getUsersByTenant:', error);
    return res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
};

// 6. ОБНОВЛЕНИЕ ПОЛЬЗОВАТЕЛЯ (ИСПРАВЛЕНО: Безопасное обновление без конфликта путей)
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Неверный ID' });
    }

    const updateData = { ...req.body };

    // Если обновляется пароль — хешируем его
    if (updateData.password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(updateData.password, salt);
    }

    // 💡 ОПРЕДЕЛЯЕМ ДОЛЖНОСТЬ
    const extractedTitle = updateData.roleTitle || updateData.title || updateData.staffProfile?.title;

    // ⚠️ Убираем родительские объекты и плоские фейк-поля, чтобы избежать конфликта в Mongo ($set)
    delete updateData.staffProfile;
    delete updateData.roleTitle;
    delete updateData.title;

    // Если должность передана — корректно обновляем staffProfile.title через точечную нотацию Mongoose
    if (extractedTitle) {
      updateData['staffProfile.title'] = extractedTitle;
    }

    const user = await User.findByIdAndUpdate(
      id, 
      { $set: updateData }, 
      { new: true, runValidators: true }
    ).select('-password -__v');

    if (!user) return res.status(404).json({ message: 'Пользователь не найден' });

    return res.json({ message: 'Пользователь обновлен', user });
  } catch (error) {
    console.error('Error in updateUser:', error);
    return res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
};
// 7. УДАЛЕНИЕ ПОЛЬЗОВАТЕЛЯ
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Неверный ID' });
    }

    const user = await User.findByIdAndDelete(id);
    if (!user) return res.status(404).json({ message: 'Пользователь не найден' });

    return res.json({ message: 'Пользователь удален', id });
  } catch (error) {
    console.error('Error in deleteUser:', error);
    return res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
};

// 8. СОЗДАНИЕ СОТРУДНИКА / БАРБЕРА (ИСПРАВЛЕНО: Запись должности в staffProfile.title)
exports.createStaff = async (req, res) => {
  try {
    const { tenantId, name, phone, email, password, roleTitle, title, role, staffProfile } = req.body;

    if (!name || !tenantId) {
      return res.status(400).json({ message: 'Имя и tenantId обязательны' });
    }

    if (!mongoose.Types.ObjectId.isValid(tenantId)) {
      return res.status(400).json({ message: 'Неверный формат tenantId' });
    }

    const cleanPhone = phone ? phone.trim() : undefined;
    const cleanEmail = email && email.trim() !== '' 
      ? email.toLowerCase().trim() 
      : `staff_${Date.now()}_${Math.floor(Math.random() * 1000)}@barber.local`;

    if (cleanPhone) {
      const existingUser = await User.findOne({ phone: cleanPhone });
      if (existingUser) {
        return res.status(400).json({ message: 'Пользователь с таким телефоном уже существует' });
      }
    }

    const rawPassword = password || 'Barber123!';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(rawPassword, salt);

    // 💡 Берем должность из любого переданного источника
    const targetTitle = roleTitle || title || staffProfile?.title || 'Barber';

    const newStaff = new User({
      tenantId,
      name: name.trim(),
      phone: cleanPhone,
      email: cleanEmail,
      password: hashedPassword,
      role: role || 'staff',
      staffProfile: {
        ...(staffProfile || {}),
        title: targetTitle
      },
      isActive: true
    });

    await newStaff.save();

    const staffResponse = newStaff.toObject();
    delete staffResponse.password;

    return res.status(201).json({
      message: 'Сотрудник успешно создан',
      user: staffResponse
    });
  } catch (error) {
    console.error('Error in createStaff:', error);

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0] || 'поле';
      return res.status(400).json({ message: `Сотрудник с таким ${field} уже существует` });
    }

    return res.status(500).json({ message: 'Ошибка сервера при создании сотрудника', error: error.message });
  }
};