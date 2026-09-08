const express = require('express');
const { pool } = require('../db');

const router = express.Router();

/**
 * POST /api/cleanup
 *
 * Protected cleanup endpoint for cron-job.org.
 *
 * Deletes:
 * - Bookings older than 60 days
 * - Customer push subscriptions with no matching booking
 * - Sessions older than 30 days
 */
router.post('/cleanup', async (req, res) => {
  try {
    // Verify cron secret
    const cronSecret = req.headers['x-cron-secret'];

    if (!cronSecret || cronSecret !== process.env.CRON_SECRET) {
      return res.status(401).json({
        error: 'Unauthorized',
      });
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Delete bookings older than 60 days
      const bookingsResult = await client.query(`
        DELETE FROM bookings
        WHERE created_at < NOW() - INTERVAL '2 days'
      `);

      // Delete customer push subscriptions
      // that no longer have a corresponding booking
      const pushResult = await client.query(`
        DELETE FROM customer_push_subs
        WHERE booking_code NOT IN (
          SELECT booking_code
          FROM bookings
          WHERE booking_code IS NOT NULL
        )
      `);

      // Delete sessions older than 30 days
      const sessionsResult = await client.query(`
        DELETE FROM sessions
        WHERE created_at < NOW() - INTERVAL '2 days'
      `);

      await client.query('COMMIT');

      console.log(
        `Cleanup complete: ${bookingsResult.rowCount} bookings, ` +
        `${pushResult.rowCount} customer push subscriptions, ` +
        `${sessionsResult.rowCount} sessions deleted.`
      );

      res.json({
        ok: true,
        deleted: {
          bookings: bookingsResult.rowCount,
          customerPushSubscriptions: pushResult.rowCount,
          sessions: sessionsResult.rowCount,
        },
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Cleanup failed:', err);

    res.status(500).json({
      error: 'Cleanup failed',
    });
  }
});

module.exports = router;
