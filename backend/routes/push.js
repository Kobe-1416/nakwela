// routes/push.js

const express = require('express');
const { pool } = require('../db');
const { requireOwner } = require('../middleware/auth');

const router = express.Router();

/**
 * POST /api/businesses/:id/owner-push
 * Save/update the owner's push subscription.
 */
router.post('/businesses/:id/owner-push', requireOwner, async (req, res) => {
  try {
    if (req.ownerBusinessId !== req.params.id) {
      return res.status(403).json({
        error: 'Forbidden',
      });
    }

    const { subscription } = req.body;

    if (!subscription) {
      return res.status(400).json({
        error: 'subscription required',
      });
    }

    await pool.query(
      `INSERT INTO owner_push_subs
      (business_id, subscription, updated_at)
      VALUES ($1, $2, NOW())
      ON CONFLICT (business_id)
      DO UPDATE
      SET
        subscription = $2,
        updated_at = NOW()`,
      [
        req.params.id,
        JSON.stringify(subscription),
      ]
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
 * POST /api/bookings/:code/customer-push
 * Save/update a customer's push subscription.
 */
router.post('/bookings/:code/customer-push', async (req, res) => {
  try {
    const { subscription } = req.body;

    if (!subscription) {
      return res.status(400).json({
        error: 'subscription required',
      });
    }

    await pool.query(
      `INSERT INTO customer_push_subs
      (booking_code, subscription)
      VALUES ($1, $2)
      ON CONFLICT (booking_code)
      DO UPDATE
      SET subscription = $2`,
      [
        req.params.code,
        JSON.stringify(subscription),
      ]
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

module.exports = router;