// middleware/auth.js

const { pool } = require('../db');

async function requireOwner(req, res, next) {
  try {
    const auth = req.headers.authorization || '';
    const token = auth.replace('Bearer ', '').trim();

    if (!token) {
      return res.status(401).json({
        error: 'No token provided'
      });
    }

    const { rows } = await pool.query(
      `SELECT business_id
       FROM sessions
       WHERE token = $1`,
      [token]
    );

    if (!rows.length) {
      return res.status(401).json({
        error: 'Invalid or expired session'
      });
    }

    req.ownerBusinessId = rows[0].business_id;
    req.sessionToken = token;

    next();
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: 'Authentication failed'
    });
  }
}

module.exports = {
  requireOwner
};