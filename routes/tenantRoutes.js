const express = require('express');
const router = express.Router();
const tenantController = require('../controllers/tenantController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

router.get('/', tenantController.getAllTenants);
router.get('/:slug', tenantController.getTenantBySlug);
router.post('/', [authMiddleware, adminMiddleware], tenantController.createTenant);
router.put('/:id', [authMiddleware, adminMiddleware], tenantController.updateTenant);
router.delete('/:id', [authMiddleware, adminMiddleware], tenantController.deleteTenant);

module.exports = router;