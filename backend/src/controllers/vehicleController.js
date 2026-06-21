const Vehicle = require('../models/Vehicle');
const Alert = require('../models/Alert');

exports.getAllVehicles = async (req, res) => {
  try {
    const vehicles = await Vehicle.getAll();
    res.json({ success: true, data: vehicles });
  } catch (error) {
    console.error('Error in getAllVehicles controller:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};

exports.getVehicleById = async (req, res) => {
  try {
    const vehicle = await Vehicle.getById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ success: false, error: 'Vehicle not found' });
    }
    res.json({ success: true, data: vehicle });
  } catch (error) {
    console.error('Error in getVehicleById controller:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};

exports.updateVehicleStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['active', 'idle', 'maintenance', 'offline'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status value' });
    }

    const updatedVehicle = await Vehicle.updateStatus(req.params.id, status);
    if (!updatedVehicle) {
      return res.status(404).json({ success: false, error: 'Vehicle not found' });
    }

    res.json({ success: true, data: updatedVehicle });
  } catch (error) {
    console.error('Error in updateVehicleStatus controller:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};

exports.getStats = async (req, res) => {
  try {
    const vehicles = await Vehicle.getAll();
    
    // Count based on real-time merged vehicle statuses
    let total = vehicles.length;
    let active = 0;
    let idle = 0;
    let maintenance = 0;
    let offline = 0;

    vehicles.forEach((v) => {
      switch (v.status) {
        case 'active':
          active++;
          break;
        case 'idle':
          idle++;
          break;
        case 'maintenance':
          maintenance++;
          break;
        case 'offline':
          offline++;
          break;
      }
    });

    const criticalAlerts = await Alert.getCountUnresolvedCritical();

    res.json({
      success: true,
      data: {
        total,
        active,
        idle,
        maintenance,
        offline,
        criticalAlerts,
      },
    });
  } catch (error) {
    console.error('Error in getStats controller:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};
