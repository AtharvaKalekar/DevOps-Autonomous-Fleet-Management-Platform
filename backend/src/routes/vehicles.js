const express = require('express');
const router = express.Router();
const vehicleController = require('../controllers/vehicleController');

// GET /api/vehicles
router.get('/', vehicleController.getAllVehicles);

// GET /api/vehicles/:id
router.get('/:id', vehicleController.getVehicleById);

// PATCH /api/vehicles/:id/status
router.patch('/:id/status', vehicleController.updateVehicleStatus);

module.exports = router;
