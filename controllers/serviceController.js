const mongoose = require('mongoose');
const Service = require('../models/Service');

exports.getServicesByTenant = async (req, res) => {
  try {
    const { tenantId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(tenantId)) {
      return res.status(400).json({ error: 'Неверный формат tenantId' });
    }
    const services = await Service.find({ tenantId }).sort({ createdAt: -1 }).lean();
    return res.json(services);
  } catch (error) {
    return res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
};

exports.createService = async (req, res) => {
  try {
    // 1. Добавили category (и description / isEnabled на будущее) в деструктуризацию
    const { tenantId, title, durationMinutes, price, category, description, isEnabled } = req.body;

    if (!tenantId || !title || durationMinutes === undefined || price === undefined) {
      return res.status(400).json({ error: 'Все поля обязательны' });
    }
    if (!mongoose.Types.ObjectId.isValid(tenantId)) {
      return res.status(400).json({ error: 'Неверный формат tenantId' });
    }

    // 2. Передаем category при создании нового документа
    const service = new Service({
      tenantId,
      title: title.trim(),
      durationMinutes: Number(durationMinutes),
      price: Number(price),
      category: category || 'haircut', // Передаем категорию из тела запроса!
      description: description || '',
      isEnabled: isEnabled !== undefined ? isEnabled : true
    });

    await service.save();
    return res.status(201).json({ message: 'Услуга успешно создана', service });
  } catch (error) {
    return res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
};

exports.updateService = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Неверный ID услуги' });
    }

    const service = await Service.findByIdAndUpdate(
      id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!service) return res.status(404).json({ error: 'Услуга не найдена' });
    return res.json({ message: 'Услуга успешно обновлена', service });
  } catch (error) {
    return res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
};

// controllers/serviceController.js
exports.updateServiceStatus = async (req, res) => {
  try {
    const service = await Service.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }
    res.json({ success: true, data: service });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteService = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Неверный ID услуги' });
    }

    const service = await Service.findByIdAndDelete(id);
    if (!service) return res.status(404).json({ error: 'Услуга не найдена' });

    return res.json({ message: 'Услуга успешно удалена', id });
  } catch (error) {
    return res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
};