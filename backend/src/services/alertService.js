const EventEmitter = require('events');
const Alert = require('../models/Alert');
const db = require('../db/postgres');

class AlertService extends EventEmitter {
  async createAlert({ vehicle_id, type, severity, message }) {
    try {
      // 1. Create alert in database
      const alert = await Alert.create({ vehicle_id, type, severity, message });
      
      // 2. Fetch vehicle details to include vehicle name in WebSocket update
      const vehicleResult = await db.query('SELECT name FROM vehicles WHERE id = $1', [vehicle_id]);
      const vehicleName = vehicleResult.rows.length > 0 ? vehicleResult.rows[0].name : 'Unknown';
      
      const enrichedAlert = {
        ...alert,
        vehicle_name: vehicleName,
      };

      // 3. Emit event so WebSocket server can broadcast it
      this.emit('new_alert', enrichedAlert);
      
      return enrichedAlert;
    } catch (err) {
      console.error('Error creating alert in AlertService:', err);
      throw err;
    }
  }

  async getUnresolved() {
    return await Alert.getUnresolved();
  }

  async resolveAlert(id) {
    const resolvedAlert = await Alert.resolve(id);
    if (resolvedAlert) {
      this.emit('alert_resolved', resolvedAlert);
    }
    return resolvedAlert;
  }
}

// Export single instance for global event emitter capability
const alertServiceInstance = new AlertService();
module.exports = alertServiceInstance;
