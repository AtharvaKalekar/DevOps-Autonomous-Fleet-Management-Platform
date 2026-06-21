const db = require('../db/postgres');
const { client: redisClient } = require('../db/redis');

class Vehicle {
  static async create({ name, type, status, region, assigned_route }) {
    const result = await db.query(
      `INSERT INTO vehicles (name, type, status, region, assigned_route)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name, type, status, region, assigned_route]
    );
    return result.rows[0];
  }

  static async getAll() {
    // 1. Get all vehicles from PostgreSQL
    const result = await db.query('SELECT * FROM vehicles ORDER BY name ASC');
    const vehicles = result.rows;

    // 2. Fetch latest telemetry from Redis for each vehicle in parallel
    const vehiclesWithTelemetry = await Promise.all(
      vehicles.map(async (vehicle) => {
        try {
          const telemetryStr = await redisClient.get(`telemetry:${vehicle.id}`);
          if (telemetryStr) {
            const telemetry = JSON.parse(telemetryStr);
            return {
              ...vehicle,
              // Overwrite status with telemetry status in case it changed in real-time, or keep PG status
              // Let's keep them in sync
              latitude: parseFloat(telemetry.latitude),
              longitude: parseFloat(telemetry.longitude),
              speed: parseFloat(telemetry.speed),
              fuel_level: parseFloat(telemetry.fuel_level),
              engine_temp: parseFloat(telemetry.engine_temp),
              battery_voltage: parseFloat(telemetry.battery_voltage),
              last_telemetry_time: telemetry.timestamp,
            };
          }

          // Fallback: Query latest telemetry from PostgreSQL
          const pgTelemetry = await db.query(
            `SELECT latitude, longitude, speed, fuel_level, engine_temp, battery_voltage, timestamp
             FROM telemetry
             WHERE vehicle_id = $1
             ORDER BY timestamp DESC
             LIMIT 1`,
            [vehicle.id]
          );

          if (pgTelemetry.rows.length > 0) {
            const t = pgTelemetry.rows[0];
            return {
              ...vehicle,
              latitude: parseFloat(t.latitude),
              longitude: parseFloat(t.longitude),
              speed: parseFloat(t.speed),
              fuel_level: parseFloat(t.fuel_level),
              engine_temp: parseFloat(t.engine_temp),
              battery_voltage: parseFloat(t.battery_voltage),
              last_telemetry_time: t.timestamp,
            };
          }

          // No telemetry yet
          return {
            ...vehicle,
            latitude: null,
            longitude: null,
            speed: 0,
            fuel_level: 100,
            engine_temp: 80,
            battery_voltage: 12.6,
            last_telemetry_time: null,
          };
        } catch (err) {
          console.error(`Error loading telemetry for vehicle ${vehicle.id}:`, err);
          return vehicle;
        }
      })
    );

    return vehiclesWithTelemetry;
  }

  static async getById(id) {
    const result = await db.query('SELECT * FROM vehicles WHERE id = $1', [id]);
    if (result.rows.length === 0) return null;
    const vehicle = result.rows[0];

    // Get telemetry from Redis
    try {
      const telemetryStr = await redisClient.get(`telemetry:${vehicle.id}`);
      if (telemetryStr) {
        const telemetry = JSON.parse(telemetryStr);
        return {
          ...vehicle,
          latitude: parseFloat(telemetry.latitude),
          longitude: parseFloat(telemetry.longitude),
          speed: parseFloat(telemetry.speed),
          fuel_level: parseFloat(telemetry.fuel_level),
          engine_temp: parseFloat(telemetry.engine_temp),
          battery_voltage: parseFloat(telemetry.battery_voltage),
          last_telemetry_time: telemetry.timestamp,
        };
      }
    } catch (err) {
      console.error(`Error fetching Redis telemetry for vehicle ${id}:`, err);
    }

    // Fallback/Standard load from PG
    const pgTelemetry = await db.query(
      `SELECT latitude, longitude, speed, fuel_level, engine_temp, battery_voltage, timestamp
       FROM telemetry
       WHERE vehicle_id = $1
       ORDER BY timestamp DESC
       LIMIT 1`,
      [id]
    );

    if (pgTelemetry.rows.length > 0) {
      const t = pgTelemetry.rows[0];
      return {
        ...vehicle,
        latitude: parseFloat(t.latitude),
        longitude: parseFloat(t.longitude),
        speed: parseFloat(t.speed),
        fuel_level: parseFloat(t.fuel_level),
        engine_temp: parseFloat(t.engine_temp),
        battery_voltage: parseFloat(t.battery_voltage),
        last_telemetry_time: t.timestamp,
      };
    }

    return {
      ...vehicle,
      latitude: null,
      longitude: null,
      speed: 0,
      fuel_level: 100,
      engine_temp: 80,
      battery_voltage: 12.6,
      last_telemetry_time: null,
    };
  }

  static async updateStatus(id, status) {
    const result = await db.query(
      'UPDATE vehicles SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );
    return result.rows[0];
  }
}

module.exports = Vehicle;
