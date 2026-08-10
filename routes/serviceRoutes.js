const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/serviceController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

router.get('/tenant/:tenantId', serviceController.getServicesByTenant);
router.post('/', [authMiddleware, adminMiddleware], serviceController.createService);
router.put('/:id', [authMiddleware, adminMiddleware], serviceController.updateService);

// 🛠️ ДОБАВЬ ЭТУ СТРОКУ:
router.patch('/:id', [authMiddleware, adminMiddleware], serviceController.updateService);

router.delete('/:id', [authMiddleware, adminMiddleware], serviceController.deleteService);

module.exports = router;