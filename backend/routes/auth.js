// routes/auth.js

const express = require('express');
const bcrypt = require('bcryptjs');

const { pool } = require('../db');
const { requireOwner } = require('../middleware/auth');
const { generateToken } = require('../utils/tokens');

const router = express.Router();

/**
 * POST /api/businesses/:id/login
 * Owner logs into their business dashboard.
 */
router.post('/businesses/:id/login', async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        error: 'Password required',
      });
    }

    const { rows } = await pool.query(
      `SELECT password_hash
       FROM businesses
       WHERE id = $1`,
      [req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({
        error: 'Business not found',
      });
    }

    if (!rows[0].password_hash) {
      return res.status(403).json({
        error: 'No password set for this business',
      });
    }

    const match = await bcrypt.compare(
      password,
      rows[0].password_hash
    );

    if (!match) {
      return res.status(401).json({
        error: 'Incorrect password',
      });
    }

    const token = generateToken();

    await pool.query(
      `INSERT INTO sessions
      (token, business_id)
      VALUES ($1, $2)`,
      [token, req.params.id]
    );

    res.json({
      token,
      businessId: req.params.id,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: 'Internal server error',
    });
  }
});

/**
 * POST /api/owner/logout
 * Deletes the current session.
 */
router.post('/owner/logout', requireOwner, async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM sessions WHERE token = $1',
      [req.sessionToken]
    );

    res.json({
      ok: true,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: 'Internal server error',
    });
  }
});

/**
 * GET /api/owner/me
 * Used by the frontend to verify
 * that the saved token is still valid.
 */
router.get('/owner/me', requireOwner, async (req, res) => {
  res.json({
    businessId: req.ownerBusinessId,
  });
});

module.exports = router;