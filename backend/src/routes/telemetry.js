const express = require('express');
const router = express.Router();
const telemetryController = require('../controllers/telemetryController');

// GET /api/telemetry/:vehicleId
router.get('/:vehicleId', telemetryController.getTelemetryHistory);

module.exports = router;
