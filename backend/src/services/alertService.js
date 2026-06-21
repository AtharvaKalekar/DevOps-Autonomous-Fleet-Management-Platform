const EventEmitter = require('events');
const Alert = require('../models/Alert');
const db = require('../db/postgres');

class AlertService extends EventEmitter {
  async createAlert({ vehicle_id, type, severity, message }) {
    try {
      // 1. Check if there's already an unresolved alert of this type for this vehicle
      const existing = await Alert.findUnresolved(vehicle_id, type);
      
      let alert;
      let isNew = true;
      if (existing) {
        alert = await Alert.incrementOccurrence(existing.id);
        isNew = false;
      } else {
        // Create alert in database
        alert = await Alert.create({ vehicle_id, type, severity, message });
      }
      
      // 2. Fetch vehicle details to include vehicle name in WebSocket update
      const vehicleResult = await db.query('SELECT name FROM vehicles WHERE id = $1', [vehicle_id]);
      const vehicleName = vehicleResult.rows.length > 0 ? vehicleResult.rows[0].name : 'Unknown';
      
      const enrichedAlert = {
        ...alert,
        vehicle_name: vehicleName,
      };

      // 3. Emit event so WebSocket server can broadcast it
      if (isNew) {
        this.emit('new_alert', enrichedAlert);
      } else {
        this.emit('alert_updated', enrichedAlert);
      }
      
      return enrichedAlert;
    } catch (err) {
      console.error('Error creating alert in AlertService:', err);
      throw err;
    }
  }

  async getUnresolved() {
    return await Alert.getUnresolved();
  }

  async getAlerts({ resolved }) {
    return await Alert.getAllAlerts({ resolved });
  }

  async resolveAlert(id) {
    const resolvedAlert = await Alert.resolve(id);
    if (resolvedAlert) {
      this.emit('alert_resolved', resolvedAlert);
    }
    return resolvedAlert;
  }

  async resolveAll({ severity, vehicle_id }) {
    const resolvedAlerts = await Alert.resolveAll({ severity, vehicle_id });
    resolvedAlerts.forEach((alert) => {
      this.emit('alert_resolved', alert);
    });
    return resolvedAlerts;
  }
}

// Export single instance for global event emitter capability
const alertServiceInstance = new AlertService();
module.exports = alertServiceInstance;
