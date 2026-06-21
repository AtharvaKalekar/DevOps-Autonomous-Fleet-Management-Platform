const db = require('../db/postgres');
const Vehicle = require('../models/Vehicle');
const telemetryService = require('../services/telemetryService');
const alertService = require('../services/alertService');

const REGION_BOUNDS = {
  Asia: { latMin: 20.0, latMax: 35.0, lngMin: 70.0, lngMax: 90.0 },
  Europe: { latMin: 45.0, latMax: 55.0, lngMin: 5.0, lngMax: 25.0 },
  NorthAmerica: { latMin: 35.0, latMax: 50.0, lngMin: -100.0, lngMax: -75.0 },
};

// Seed vehicles data
const SEED_VEHICLES = [
  // Asia: 7 vehicles (5 active, 1 idle, 1 maintenance)
  { name: 'Truck-001', type: 'truck', status: 'active', region: 'Asia', assigned_route: 'Mumbai-Delhi Corridor' },
  { name: 'Truck-002', type: 'truck', status: 'active', region: 'Asia', assigned_route: 'Beijing-Shanghai Express' },
  { name: 'Truck-003', type: 'truck', status: 'active', region: 'Asia', assigned_route: 'Tokyo-Osaka Route' },
  { name: 'Truck-004', type: 'truck', status: 'active', region: 'Asia', assigned_route: 'Seoul-Busan Transit' },
  { name: 'Truck-005', type: 'truck', status: 'active', region: 'Asia', assigned_route: 'Jakarta-Surabaya Link' },
  { name: 'Truck-006', type: 'truck', status: 'idle', region: 'Asia', assigned_route: 'Bangkok-Singapore Highway' },
  { name: 'Truck-007', type: 'truck', status: 'maintenance', region: 'Asia', assigned_route: 'Hanoi-Saigon Beltway' },

  // Europe: 7 vehicles (5 active, 1 idle, 1 offline)
  { name: 'Van-101', type: 'van', status: 'active', region: 'Europe', assigned_route: 'Paris-Berlin Express' },
  { name: 'Van-102', type: 'van', status: 'active', region: 'Europe', assigned_route: 'London-Edinburgh Corridor' },
  { name: 'Van-103', type: 'van', status: 'active', region: 'Europe', assigned_route: 'Rome-Milan Direct' },
  { name: 'Van-104', type: 'van', status: 'active', region: 'Europe', assigned_route: 'Madrid-Barcelona Autopista' },
  { name: 'Van-105', type: 'van', status: 'active', region: 'Europe', assigned_route: 'Amsterdam-Brussels Shuttle' },
  { name: 'Van-106', type: 'van', status: 'idle', region: 'Europe', assigned_route: 'Warsaw-Prague Route' },
  { name: 'Van-107', type: 'van', status: 'offline', region: 'Europe', assigned_route: 'Vienna-Munich Highway' },

  // North America: 6 vehicles (4 active, 1 idle, 1 maintenance)
  { name: 'AV-201', type: 'autonomous', status: 'active', region: 'North America', assigned_route: 'US Route 66 Corridor' },
  { name: 'AV-202', type: 'autonomous', status: 'active', region: 'North America', assigned_route: 'I-95 East Coast Expressway' },
  { name: 'AV-203', type: 'autonomous', status: 'active', region: 'North America', assigned_route: 'Trans-Canada Highway' },
  { name: 'AV-204', type: 'autonomous', status: 'active', region: 'North America', assigned_route: 'Pacific Coast Route' },
  { name: 'AV-205', type: 'autonomous', status: 'idle', region: 'North America', assigned_route: 'I-10 Southern Beltway' },
  { name: 'AV-206', type: 'autonomous', status: 'maintenance', region: 'North America', assigned_route: 'Midwest Logistics Loop' },
];

class FleetSimulator {
  constructor() {
    this.vehicles = [];
    this.intervalId = null;
    this.saveCounter = 0;
    this.telemetryBuffer = [];
    
    // Regional connectivity outage simulator
    this.regionalOutages = {
      'Asia': false,
      'Europe': false,
      'North America': false,
    };
    
    // Broadcast callback registered by WS server
    this.onUpdateCallback = null;
  }

  registerOnUpdate(callback) {
    this.onUpdateCallback = callback;
  }

  async start() {
    try {
      console.log('Starting fleet simulator...');
      await this.ensureSeeded();
      await this.loadVehicles();
      
      const intervalMs = parseInt(process.env.SIMULATOR_INTERVAL_MS, 10) || 3000;
      this.intervalId = setInterval(() => this.tick(), intervalMs);
      console.log(`Simulator running at interval: ${intervalMs}ms`);
    } catch (err) {
      console.error('Failed to start Fleet Simulator:', err);
    }
  }

  async ensureSeeded() {
    const check = await db.query('SELECT COUNT(*)::integer as count FROM vehicles');
    if (check.rows[0].count === 0) {
      console.log('Seeding 20 initial vehicles into the database...');
      for (const v of SEED_VEHICLES) {
        await Vehicle.create(v);
      }
      console.log('Seeding complete.');
    } else {
      console.log('Vehicles already exist in database. Skipping seed.');
    }
  }

  async loadVehicles() {
    const list = await db.query('SELECT * FROM vehicles');
    this.vehicles = list.rows.map((vehicle) => {
      // Setup simulator state for each vehicle
      const regionKey = vehicle.region.replace(' ', ''); // "North America" -> "NorthAmerica"
      const bounds = REGION_BOUNDS[regionKey] || REGION_BOUNDS.Asia;
      
      // Random starting location in bounds
      const latitude = bounds.latMin + Math.random() * (bounds.latMax - bounds.latMin);
      const longitude = bounds.lngMin + Math.random() * (bounds.lngMax - bounds.lngMin);
      
      return {
        ...vehicle,
        latitude,
        longitude,
        speed: vehicle.status === 'active' ? 50 + Math.random() * 40 : 0,
        fuel_level: 60 + Math.random() * 40, // Start with plenty of fuel
        engine_temp: 75 + Math.random() * 10,
        battery_voltage: 12.6 + Math.random() * 1.2,
        // Step vector
        stepLat: (Math.random() > 0.5 ? 1 : -1) * (0.002 + Math.random() * 0.003),
        stepLng: (Math.random() > 0.5 ? 1 : -1) * (0.002 + Math.random() * 0.003),
        activeAlerts: {
          low_fuel: false,
          engine_warning: false,
        },
      };
    });
    console.log(`Loaded ${this.vehicles.length} vehicles into simulator state.`);
  }

  async tick() {
    const updates = [];
    const saveIntervalTicks = Math.floor(
      (parseInt(process.env.TELEMETRY_DB_SAVE_INTERVAL_MS, 10) || 30000) / 
      (parseInt(process.env.SIMULATOR_INTERVAL_MS, 10) || 3000)
    );

    this.saveCounter++;
    const shouldSaveToPostgres = this.saveCounter >= saveIntervalTicks;
    if (shouldSaveToPostgres) {
      this.saveCounter = 0;
    }

    // Refresh database statuses dynamically in case a user modified a status via API
    // To do this simply without query spam, we can read actual DB statuses occasionally or sync them.
    // Let's query db statuses to ensure PATCH /api/vehicles/:id/status updates simulator status!
    let dbStatuses = {};
    try {
      const dbVehicles = await db.query('SELECT id, status FROM vehicles');
      dbVehicles.rows.forEach(v => {
        dbStatuses[v.id] = v.status;
      });
    } catch (err) {
      console.error('Simulator error reading live status from DB:', err);
    }

    for (const vehicle of this.vehicles) {
      // Check for regional connectivity outage simulation
      const hasRegionalOutage = this.regionalOutages[vehicle.region] === true;
      if (hasRegionalOutage) {
        if (vehicle.status !== 'offline') {
          vehicle.status = 'offline';
          vehicle.speed = 0;
          alertService.createAlert({
            vehicle_id: vehicle.id,
            type: 'offline',
            severity: 'critical',
            message: `📡 Connection Lost: Regional outage detected in ${vehicle.region} for ${vehicle.name}`,
          }).catch(err => console.error('Error creating outage alert:', err));
        } else {
          vehicle.status = 'offline';
          vehicle.speed = 0;
        }
      } else if (dbStatuses[vehicle.id]) {
        // If recovered, sync status from DB
        vehicle.status = dbStatuses[vehicle.id];
      }

      const regionKey = vehicle.region.replace(' ', '');
      const bounds = REGION_BOUNDS[regionKey] || REGION_BOUNDS.Asia;

      // 1. Move position if active
      if (vehicle.status === 'active') {
        vehicle.latitude += vehicle.stepLat;
        vehicle.longitude += vehicle.stepLng;

        // Bounce off bounds
        if (vehicle.latitude < bounds.latMin || vehicle.latitude > bounds.latMax) {
          vehicle.stepLat *= -1;
          vehicle.latitude += vehicle.stepLat;
        }
        if (vehicle.longitude < bounds.lngMin || vehicle.longitude > bounds.lngMax) {
          vehicle.stepLng *= -1;
          vehicle.longitude += vehicle.stepLng;
        }
      }

      // 2. Speed update
      if (vehicle.status === 'active') {
        // Smooth walk speed slightly
        vehicle.speed += (Math.random() - 0.5) * 15;
        if (vehicle.speed < 30) vehicle.speed = 30;
        if (vehicle.speed > 120) vehicle.speed = 120;
      } else if (vehicle.status === 'maintenance') {
        // Slow speed or 0
        vehicle.speed = Math.random() > 0.7 ? Math.floor(Math.random() * 15) : 0;
      } else {
        vehicle.speed = 0;
      }

      // 3. Fuel depletion
      if (vehicle.status === 'active') {
        vehicle.fuel_level -= 0.15 + Math.random() * 0.15; // Decreases by ~0.15-0.3% per tick
      } else if (vehicle.status === 'idle') {
        vehicle.fuel_level -= 0.02 + Math.random() * 0.03; // idle fuel usage is tiny
      }

      if (vehicle.fuel_level < 0) vehicle.fuel_level = 0;

      // Auto refill when below 10%
      if (vehicle.fuel_level < 10) {
        console.log(`Simulator: Refueling vehicle ${vehicle.name} (${vehicle.id})`);
        vehicle.fuel_level = 100;
        vehicle.activeAlerts.low_fuel = false; // reset alert tracking
      }

      // 4. Engine temperature
      if (vehicle.status === 'active') {
        // Normal drift: 75-92°C
        vehicle.engine_temp += (Math.random() - 0.5) * 4;
        if (vehicle.engine_temp < 75) vehicle.engine_temp = 75;
        if (vehicle.engine_temp > 92) vehicle.engine_temp = 92;
        
        // 1% chance of temp spike
        if (Math.random() < 0.01) {
          vehicle.engine_temp = 101 + Math.random() * 10;
        }
      } else {
        // Cool down if offline/idle
        vehicle.engine_temp -= 1.5;
        if (vehicle.engine_temp < 30) vehicle.engine_temp = 30;
      }

      // 5. Battery voltage
      if (vehicle.status === 'active') {
        vehicle.battery_voltage = 13.5 + (Math.random() - 0.5) * 0.8;
      } else {
        vehicle.battery_voltage = 12.2 + (Math.random() - 0.5) * 0.4;
      }

      // 6. Check Alerts conditions
      await this.checkSensorAlerts(vehicle);

      // 7. Push telemetry update to Redis cache
      const telemetryObj = {
        latitude: vehicle.latitude,
        longitude: vehicle.longitude,
        speed: Math.round(vehicle.speed * 10) / 10,
        fuel_level: Math.round(vehicle.fuel_level * 10) / 10,
        engine_temp: Math.round(vehicle.engine_temp * 10) / 10,
        battery_voltage: Math.round(vehicle.battery_voltage * 10) / 10,
        status: vehicle.status,
      };

      const cached = await telemetryService.cacheTelemetry(vehicle.id, telemetryObj);
      
      // Collect for WebSocket broadcast
      updates.push({
        vehicleId: vehicle.id,
        name: vehicle.name,
        lat: cached.latitude,
        lng: cached.longitude,
        speed: cached.speed,
        fuel: cached.fuel_level,
        engineTemp: cached.engine_temp,
        status: vehicle.status,
      });

      // Collect for PG batch insert
      if (shouldSaveToPostgres) {
        this.telemetryBuffer.push({
          vehicle_id: vehicle.id,
          latitude: cached.latitude,
          longitude: cached.longitude,
          speed: cached.speed,
          fuel_level: cached.fuel_level,
          engine_temp: cached.engine_temp,
          battery_voltage: cached.battery_voltage,
          timestamp: new Date(cached.timestamp),
        });
      }
    }

    // Broadcast update via WebSocket callback
    if (this.onUpdateCallback && updates.length > 0) {
      this.onUpdateCallback(updates);
    }

    // Persist batch to DB if ready
    if (shouldSaveToPostgres && this.telemetryBuffer.length > 0) {
      const recordsToSave = [...this.telemetryBuffer];
      this.telemetryBuffer = [];
      // async persistence in background
      telemetryService.saveBatchToPostgres(recordsToSave).catch(err => {
        console.error('Async batch save failed:', err);
      });
    }
  }

  async checkSensorAlerts(vehicle) {
    // A. Engine Warning Alert (temp > 100)
    if (vehicle.engine_temp > 100) {
      if (!vehicle.activeAlerts.engine_warning) {
        vehicle.activeAlerts.engine_warning = true;
        await alertService.createAlert({
          vehicle_id: vehicle.id,
          type: 'engine_warning',
          severity: 'critical',
          message: `🚨 Engine temperature critical on ${vehicle.name}: ${Math.round(vehicle.engine_temp)}°C`,
        });
      }
    } else {
      vehicle.activeAlerts.engine_warning = false;
    }

    // B. Low Fuel Alert (fuel < 20%)
    if (vehicle.fuel_level < 20) {
      if (!vehicle.activeAlerts.low_fuel) {
        vehicle.activeAlerts.low_fuel = true;
        await alertService.createAlert({
          vehicle_id: vehicle.id,
          type: 'low_fuel',
          severity: 'medium',
          message: `⚠️ Low fuel warning on ${vehicle.name}: ${Math.round(vehicle.fuel_level)}%`,
        });
      }
    } else {
      vehicle.activeAlerts.low_fuel = false;
    }

    // C. 2% chance of generic alert per tick
    if (Math.random() < 0.02) {
      const alertChance = Math.random();
      if (alertChance < 0.33) {
        // Speeding alert
        if (vehicle.status === 'active' && vehicle.speed > 90) {
          await alertService.createAlert({
            vehicle_id: vehicle.id,
            type: 'speeding',
            severity: 'high',
            message: `⚡ Speeding alert: ${vehicle.name} is traveling at ${Math.round(vehicle.speed)} km/h`,
          });
        }
      } else if (alertChance < 0.66) {
        // Offline alert
        if (vehicle.status === 'offline') {
          await alertService.createAlert({
            vehicle_id: vehicle.id,
            type: 'offline',
            severity: 'medium',
            message: `📡 Connection warning: ${vehicle.name} has gone offline.`,
          });
        }
      } else {
        // Maintenance due alert
        await alertService.createAlert({
          vehicle_id: vehicle.id,
          type: 'maintenance_due',
          severity: 'low',
          message: `🔧 Preventative Maintenance: ${vehicle.name} is due for scheduled service.`,
        });
      }
    }
  }

  setRegionalOutage(region, active) {
    if (this.regionalOutages[region] !== undefined) {
      this.regionalOutages[region] = active;
      console.log(`Simulator: Outage status for region [${region}] updated to [${active}]`);
    }
  }

  getRegionalOutages() {
    return this.regionalOutages;
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('Fleet Simulator stopped.');
    }
  }
}

// Export singleton simulator instance
const simulatorInstance = new FleetSimulator();
module.exports = simulatorInstance;
