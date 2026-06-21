const alertService = require('../services/alertService');

exports.getUnresolvedAlerts = async (req, res) => {
  try {
    const resolvedParam = req.query.resolved;
    let resolved = false; // default to false (unresolved)
    if (resolvedParam === 'true') {
      resolved = true;
    } else if (resolvedParam === 'all') {
      resolved = undefined;
    }
    const alerts = await alertService.getAlerts({ resolved });
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

exports.resolveAllAlerts = async (req, res) => {
  try {
    const { severity, vehicle_id } = req.body;
    const resolved = await alertService.resolveAll({ severity, vehicle_id });
    res.json({ success: true, data: resolved });
  } catch (error) {
    console.error('Error in resolveAllAlerts controller:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};
