const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// Авторизованный профиль текущего юзера
router.get('/me', authMiddleware, userController.getCurrentUser);

// Получение мастеров тенанта
router.get('/staff/:tenantId', userController.getStaffByTenant);
router.get('/tenant/:tenantId', [authMiddleware, adminMiddleware], userController.getUsersByTenant);

// Создание сотрудника/барбера
router.post('/staff', [authMiddleware, adminMiddleware], userController.createStaff);

// Админские действия
router.put('/:id', [authMiddleware, adminMiddleware], userController.updateUser);
router.delete('/:id', [authMiddleware, adminMiddleware], userController.deleteUser);

module.exports = router;