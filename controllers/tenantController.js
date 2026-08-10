const mongoose = require('mongoose');
const Tenant = require('../models/Tenant');

exports.getAllTenants = async (req, res) => {
  try {
    const tenants = await Tenant.find().select('-__v').sort({ createdAt: -1 }).lean();
    return res.json(tenants);
  } catch (error) {
    return res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
};

exports.getTenantBySlug = async (req, res) => {
  try {
    const slug = req.params.slug.toLowerCase().trim();
    const tenant = await Tenant.findOne({ slug }).select('-__v').lean();
    if (!tenant) return res.status(404).json({ message: 'Заведение не найдено' });
    return res.json(tenant);
  } catch (error) {
    return res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
};

exports.createTenant = async (req, res) => {
  try {
    const { name, slug, phone, email } = req.body;
    if (!name || !slug) return res.status(400).json({ error: 'Поля name и slug обязательны' });

    const formattedSlug = slug.toLowerCase().trim().replace(/\s+/g, '-');
    const existingTenant = await Tenant.findOne({ slug: formattedSlug });
    if (existingTenant) return res.status(409).json({ message: 'Заведение с таким slug уже существует' });

    const tenant = new Tenant({ name: name.trim(), slug: formattedSlug, phone, email });
    await tenant.save();

    return res.status(201).json({ message: 'Заведение создано', tenant });
  } catch (error) {
    return res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
};

exports.updateTenant = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: 'Неверный ID заведения' });

    const tenant = await Tenant.findByIdAndUpdate(id, { $set: req.body }, { new: true, runValidators: true });
    if (!tenant) return res.status(404).json({ message: 'Заведение не найдено' });

    return res.json({ message: 'Заведение обновлено', tenant });
  } catch (error) {
    return res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
};

exports.deleteTenant = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: 'Неверный ID' });

    const tenant = await Tenant.findByIdAndDelete(id);
    if (!tenant) return res.status(404).json({ message: 'Заведение не найдено' });

    return res.json({ message: 'Заведение удалено', id });
  } catch (error) {
    return res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
};