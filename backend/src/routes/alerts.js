const express = require('express');
const router = express.Router();
const alertController = require('../controllers/alertController');

// GET /api/alerts
router.get('/', alertController.getUnresolvedAlerts);

// PATCH /api/alerts/:id/resolve
router.patch('/:id/resolve', alertController.resolveAlert);

module.exports = router;
