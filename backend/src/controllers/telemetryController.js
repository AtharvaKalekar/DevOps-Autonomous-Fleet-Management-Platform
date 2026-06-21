const TelemetryService = require('../services/telemetryService');

exports.getTelemetryHistory = async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const history = await TelemetryService.getHistory(vehicleId, 50);
    res.json({ success: true, data: history });
  } catch (error) {
    console.error(`Error in getTelemetryHistory controller for vehicle ${req.params.vehicleId}:`, error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};
