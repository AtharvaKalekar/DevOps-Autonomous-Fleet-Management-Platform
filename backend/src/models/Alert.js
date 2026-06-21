const db = require('../db/postgres');

class Alert {
  static async create({ vehicle_id, type, severity, message }) {
    const result = await db.query(
      `INSERT INTO alerts (vehicle_id, type, severity, message, resolved)
       VALUES ($1, $2, $3, $4, false)
       RETURNING *`,
      [vehicle_id, type, severity, message]
    );
    return result.rows[0];
  }

  static async getUnresolved() {
    const result = await db.query(
      `SELECT a.*, v.name as vehicle_name
       FROM alerts a
       JOIN vehicles v ON a.vehicle_id = v.id
       WHERE a.resolved = false
       ORDER BY a.created_at DESC`
    );
    return result.rows;
  }

  static async resolve(id) {
    const result = await db.query(
      `UPDATE alerts
       SET resolved = true
       WHERE id = $1
       RETURNING *`,
      [id]
    );
    return result.rows[0];
  }

  static async getCountUnresolved() {
    const result = await db.query(
      `SELECT COUNT(*)::integer as count FROM alerts WHERE resolved = false`
    );
    return result.rows[0].count;
  }

  static async getCountUnresolvedCritical() {
    const result = await db.query(
      `SELECT COUNT(*)::integer as count FROM alerts WHERE resolved = false AND severity = 'critical'`
    );
    return result.rows[0].count;
  }
  static async findUnresolved(vehicle_id, type) {
    const result = await db.query(
      `SELECT * FROM alerts 
       WHERE vehicle_id = $1 AND type = $2 AND resolved = false 
       LIMIT 1`,
      [vehicle_id, type]
    );
    return result.rows[0];
  }

  static async incrementOccurrence(id) {
    const result = await db.query(
      `UPDATE alerts
       SET occurrence_count = occurrence_count + 1, updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id]
    );
    return result.rows[0];
  }

  static async resolveAll({ severity, vehicle_id }) {
    let query = 'UPDATE alerts SET resolved = true WHERE resolved = false';
    let params = [];
    if (severity) {
      params.push(severity);
      query += ` AND severity = $${params.length}`;
    }
    if (vehicle_id) {
      params.push(vehicle_id);
      query += ` AND vehicle_id = $${params.length}`;
    }
    query += ' RETURNING *';
    const result = await db.query(query, params);
    return result.rows;
  }
  static async getAllAlerts({ resolved }) {
    let query = `
       SELECT a.*, v.name as vehicle_name
       FROM alerts a
       JOIN vehicles v ON a.vehicle_id = v.id
    `;
    let params = [];
    if (resolved !== undefined) {
      params.push(resolved);
      query += ` WHERE a.resolved = $1`;
    }
    query += ` ORDER BY a.updated_at DESC, a.created_at DESC`;
    const result = await db.query(query, params);
    return result.rows;
  }
}

module.exports = Alert;
