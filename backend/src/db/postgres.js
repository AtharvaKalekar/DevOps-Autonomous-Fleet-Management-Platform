const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;

const pool = new Pool({
  connectionString,
  // Add simple connection retry behavior if needed, especially useful in Docker startup
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
});

async function initDatabase() {
  const client = await pool.connect();
  try {
    console.log('Initializing PostgreSQL database schemas...');
    
    // Ensure UUID extension is loaded
    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');

    // Create ENUMs if not exists
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE vehicle_type AS ENUM ('truck', 'van', 'autonomous');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await client.query(`
      DO $$ BEGIN
        CREATE TYPE vehicle_status AS ENUM ('active', 'idle', 'maintenance', 'offline');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await client.query(`
      DO $$ BEGIN
        CREATE TYPE alert_type AS ENUM ('speeding', 'low_fuel', 'engine_warning', 'offline', 'maintenance_due');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await client.query(`
      DO $$ BEGIN
        CREATE TYPE alert_severity AS ENUM ('low', 'medium', 'high', 'critical');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create vehicles table
    await client.query(`
      CREATE TABLE IF NOT EXISTS vehicles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        type vehicle_type NOT NULL,
        status vehicle_status NOT NULL,
        region VARCHAR(255) NOT NULL,
        assigned_route VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create telemetry table
    await client.query(`
      CREATE TABLE IF NOT EXISTS telemetry (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
        latitude DOUBLE PRECISION NOT NULL,
        longitude DOUBLE PRECISION NOT NULL,
        speed DOUBLE PRECISION NOT NULL,
        fuel_level DOUBLE PRECISION NOT NULL,
        engine_temp DOUBLE PRECISION NOT NULL,
        battery_voltage DOUBLE PRECISION NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create alerts table
    await client.query(`
      CREATE TABLE IF NOT EXISTS alerts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
        type alert_type NOT NULL,
        severity alert_severity NOT NULL,
        message TEXT NOT NULL,
        resolved BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('PostgreSQL database schemas initialized successfully.');
  } catch (error) {
    console.error('Error initializing database schema:', error);
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  pool,
  initDatabase,
  query: (text, params) => pool.query(text, params),
};
