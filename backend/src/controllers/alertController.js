const alertService = require('../services/alertService');

exports.getUnresolvedAlerts = async (req, res) => {
  try {
    const alerts = await alertService.getUnresolved();
    res.json({ success: true, data: alerts });
  } catch (error) {
    console.error('Error in getUnresolvedAlerts controller:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};

exports.resolveAlert = async (req, res) => {
  try {
    const resolved = await alertService.resolveAlert(req.params.id);
    if (!resolved) {
      return res.status(404).json({ success: false, error: 'Alert not found' });
    }
    res.json({ success: true, data: resolved });
  } catch (error) {
    console.error('Error in resolveAlert controller:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};
