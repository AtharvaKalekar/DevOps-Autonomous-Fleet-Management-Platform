import axios from 'axios';

const API_BASE = 'http://localhost:4000/api';

const client = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const api = {
  getVehicles: async () => {
    const res = await client.get('/vehicles');
    return res.data;
  },

  getVehicleById: async (id) => {
    const res = await client.get(`/vehicles/${id}`);
    return res.data;
  },

  updateVehicleStatus: async (id, status) => {
    const res = await client.patch(`/vehicles/${id}/status`, { status });
    return res.data;
  },

  getTelemetryHistory: async (vehicleId) => {
    const res = await client.get(`/telemetry/${vehicleId}`);
    return res.data;
  },

  getAlerts: async (resolved = 'false') => {
    const res = await client.get(`/alerts?resolved=${resolved}`);
    return res.data;
  },

  resolveAlert: async (id) => {
    const res = await client.patch(`/alerts/${id}/resolve`);
    return res.data;
  },

  resolveAllAlerts: async ({ severity, vehicle_id } = {}) => {
    const res = await client.patch('/alerts/resolve-all', { severity, vehicle_id });
    return res.data;
  },

  getStats: async () => {
    const res = await client.get('/stats');
    return res.data;
  },

  getOutages: async () => {
    const res = await client.get('/simulator/outage');
    return res.data;
  },

  toggleOutage: async (region, active) => {
    const res = await client.post('/simulator/outage', { region, active });
    return res.data;
  },
};

export default api;
