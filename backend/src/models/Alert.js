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
}

module.exports = Alert;
