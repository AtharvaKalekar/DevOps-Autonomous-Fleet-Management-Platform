const db = require('../db/postgres');
const { client: redisClient } = require('../db/redis');

class TelemetryService {
  static async cacheTelemetry(vehicleId, telemetry) {
    try {
      const payload = {
        vehicle_id: vehicleId,
        latitude: telemetry.latitude,
        longitude: telemetry.longitude,
        speed: telemetry.speed,
        fuel_level: telemetry.fuel_level,
        engine_temp: telemetry.engine_temp,
        battery_voltage: telemetry.battery_voltage,
        timestamp: new Date().toISOString(),
      };
      await redisClient.set(`telemetry:${vehicleId}`, JSON.stringify(payload));
      return payload;
    } catch (err) {
      console.error(`Error caching telemetry for vehicle ${vehicleId} in Redis:`, err);
      throw err;
    }
  }

  static async getLatest(vehicleId) {
    try {
      const data = await redisClient.get(`telemetry:${vehicleId}`);
      if (data) return JSON.parse(data);
    } catch (err) {
      console.error(`Error getting latest telemetry from Redis:`, err);
    }
    
    // Fallback to Postgres
    const result = await db.query(
      `SELECT * FROM telemetry WHERE vehicle_id = $1 ORDER BY timestamp DESC LIMIT 1`,
      [vehicleId]
    );
    return result.rows[0] || null;
  }

  static async getHistory(vehicleId, limit = 50) {
    const result = await db.query(
      `SELECT * FROM telemetry 
       WHERE vehicle_id = $1 
       ORDER BY timestamp DESC 
       LIMIT $2`,
      [vehicleId, limit]
    );
    // Return them in ascending order of time so they display correctly left-to-right on a line chart
    return result.rows.reverse();
  }

  static async saveBatchToPostgres(records) {
    if (!records || records.length === 0) return;

    // Construct a safe batch insertion query
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      const insertQuery = `
        INSERT INTO telemetry (vehicle_id, latitude, longitude, speed, fuel_level, engine_temp, battery_voltage, timestamp)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `;

      for (const record of records) {
        await client.query(insertQuery, [
          record.vehicle_id,
          record.latitude,
          record.longitude,
          record.speed,
          record.fuel_level,
          record.engine_temp,
          record.battery_voltage,
          record.timestamp || new Date(),
        ]);
      }
      await client.query('COMMIT');
      console.log(`Successfully persisted ${records.length} telemetry records to PostgreSQL.`);
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Error batch-persisting telemetry records to PostgreSQL:', err);
      throw err;
    } finally {
      client.release();
    }
  }
}

module.exports = TelemetryService;
