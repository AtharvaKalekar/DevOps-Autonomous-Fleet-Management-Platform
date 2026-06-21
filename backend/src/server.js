// Load TCP logger first to override console logging early
require('./utils/logger');

const express = require('express');
const cors = require('cors');
const http = require('http');
require('dotenv').config();

const vaultService = require('./services/vaultService');

const app = express();
const PORT = process.env.PORT || 4000;

// Enable CORS for frontend running on localhost:3000
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
}));

app.use(express.json());

// Setup server
const server = http.createServer(app);

async function startServer() {
  try {
    // 1. Fetch database and cache secrets from Vault
    await vaultService.loadSecrets();

    // 2. Initialize database connections and dependencies
    const { initDatabase } = require('./db/postgres');
    const { initRedis } = require('./db/redis');
    const { initWebSocketServer } = require('./websocket/wsServer');
    const simulator = require('./simulator/fleetSimulator');

    const vehiclesRouter = require('./routes/vehicles');
    const telemetryRouter = require('./routes/telemetry');
    const alertsRouter = require('./routes/alerts');
    const vehicleController = require('./controllers/vehicleController');

    // Register API Routes
    app.use('/api/vehicles', vehiclesRouter);
    app.use('/api/telemetry', telemetryRouter);
    app.use('/api/alerts', alertsRouter);
    app.get('/api/stats', vehicleController.getStats);

    // Simulator Outage Routes
    app.post('/api/simulator/outage', (req, res) => {
      const { region, active } = req.body;
      if (!region || active === undefined) {
        return res.status(400).json({ success: false, error: 'Missing region or active status' });
      }
      simulator.setRegionalOutage(region, active);
      res.json({ success: true, data: simulator.getRegionalOutages() });
    });

    app.get('/api/simulator/outage', (req, res) => {
      res.json({ success: true, data: simulator.getRegionalOutages() });
    });

    // Simple Health Check
    app.get('/health', (req, res) => {
      res.json({ status: 'OK', timestamp: new Date() });
    });

    // Global Error Handler
    app.use((err, req, res, next) => {
      console.error('Unhandled server error:', err);
      res.status(500).json({ success: false, error: 'Internal Server Error' });
    });

    // Initialize databases
    await initDatabase();
    await initRedis();

    // Initialize WebSocket server
    initWebSocketServer(server);

    // Start fleet simulator
    await simulator.start();

    // Start listening
    server.listen(PORT, () => {
      console.log(`==================================================`);
      console.log(`  Fleet Analytics Server running on port ${PORT}   `);
      console.log(`==================================================`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

