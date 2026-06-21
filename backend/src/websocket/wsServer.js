const WebSocket = require('ws');
const Vehicle = require('../models/Vehicle');
const alertService = require('../services/alertService');
const simulator = require('../simulator/fleetSimulator');

function initWebSocketServer(server) {
  const wss = new WebSocket.Server({ server });
  console.log('WebSocket Server initialized.');

  // Broadcast helper
  const broadcast = (data) => {
    const message = JSON.stringify(data);
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  };

  // Register simulator callback for real-time telemetry updates
  simulator.registerOnUpdate((updates) => {
    broadcast({
      type: 'telemetry_update',
      payload: updates,
    });
  });

  // Subscribe to alertService events for real-time alerts
  alertService.on('new_alert', (enrichedAlert) => {
    broadcast({
      type: 'new_alert',
      payload: enrichedAlert,
    });
  });

  alertService.on('alert_resolved', (resolvedAlert) => {
    broadcast({
      type: 'alert_resolved',
      payload: resolvedAlert,
    });
  });

  wss.on('connection', async (ws) => {
    console.log('New WebSocket client connected.');

    // Immediately send current snapshot of all vehicles with live telemetry
    try {
      const vehicles = await Vehicle.getAll();
      ws.send(
        JSON.stringify({
          type: 'initial_state',
          payload: vehicles,
        })
      );
    } catch (err) {
      console.error('Error fetching initial vehicle state for WS connection:', err);
    }

    ws.on('close', () => {
      console.log('WebSocket client disconnected.');
    });

    ws.on('error', (err) => {
      console.error('WebSocket client connection error:', err);
    });
  });

  return wss;
}

module.exports = {
  initWebSocketServer,
};
