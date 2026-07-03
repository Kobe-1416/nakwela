// routes/bookings.js

const express = require('express');

const { pool } = require('../db');
const { requireOwner } = require('../middleware/auth');
const { generateCode } = require('../utils/bookingCode');
const { sendPush } = require('../utils/push');

const router = express.Router();

/**
 * GET /api/businesses/:id/slots?day=today|tomorrow
 * Returns all slot records for a business/day.
 */
router.get('/businesses/:id/slots', async (req, res) => {
  try {
    const dayKey =
      req.query.day === 'tomorrow'
        ? 'tomorrow'
        : 'today';

    const { rows } = await pool.query(
      `SELECT
          slot_start,
          slot_end,
          status,
          booking_code,
          reminder_mins
       FROM bookings
       WHERE business_id = $1
       AND day_key = $2`,
      [req.params.id, dayKey]
    );

    const map = {};

    for (const row of rows) {
      map[row.slot_start] = {
        status: row.status,
        code: row.booking_code,
        reminderMins: row.reminder_mins,
      };
    }

    res.json(map);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: 'Internal server error',
    });
  }
});

/**
 * POST /api/businesses/:id/bookings
 * Customer creates a booking.
 */
router.post('/businesses/:id/bookings', async (req, res) => {
  try {
    const {
      dayKey,
      slotStart,
      slotEnd,
      reminderMins,
    } = req.body;

    if (!dayKey || !slotStart || !slotEnd) {
      return res.status(400).json({
        error:
          'dayKey, slotStart and slotEnd are required',
      });
    }

    // Check if slot already exists
    const { rows: existing } = await pool.query(
      `SELECT status
       FROM bookings
       WHERE business_id = $1
       AND day_key = $2
       AND slot_start = $3`,
      [
        req.params.id,
        dayKey,
        slotStart,
      ]
    );

    if (existing.length) {
      return res.status(409).json({
        error: 'Slot already taken or blocked',
      });
    }

    const code = generateCode();

    await pool.query(
      `INSERT INTO bookings
      (
        business_id,
        day_key,
        slot_start,
        slot_end,
        status,
        booking_code,
        reminder_mins
      )
      VALUES
      ($1,$2,$3,$4,'booked',$5,$6)`,
      [
        req.params.id,
        dayKey,
        slotStart,
        slotEnd,
        code,
        reminderMins || 20,
      ]
    );

    // Notify owner
    const { rows: pushRows } = await pool.query(
      `SELECT subscription
       FROM owner_push_subs
       WHERE business_id = $1`,
      [req.params.id]
    );

    if (pushRows.length) {
      await sendPush(pushRows[0].subscription, {
        title: 'New booking!',
        body: `Someone booked the ${slotStart}–${slotEnd} slot. Code: ${code}`,
        data: {
          businessId: req.params.id,
          slotStart,
          code,
        },
      });
    }

    res.status(201).json({
      code,
      slotStart,
      slotEnd,
      dayKey,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: 'Internal server error',
    });
  }
});

/**
 * PATCH /api/businesses/:id/slots/:slotStart
 * Owner updates a slot (block / unblock / late).
 */
router.patch(
  '/businesses/:id/slots/:slotStart',
  requireOwner,
  async (req, res) => {
    try {
      if (req.ownerBusinessId !== req.params.id) {
        return res.status(403).json({
          error: 'Forbidden',
        });
      }

      const { action, slotEnd, dayKey } = req.body;

      // Remove slot completely
      if (action === 'unblock') {
        await pool.query(
          `DELETE FROM bookings
           WHERE business_id = $1
           AND day_key = $2
           AND slot_start = $3`,
          [
            req.params.id,
            dayKey,
            req.params.slotStart,
          ]
        );

        return res.json({
          ok: true,
        });
      }

      // Block slot
      if (action === 'block') {
        await pool.query(
          `INSERT INTO bookings
          (
            business_id,
            day_key,
            slot_start,
            slot_end,
            status
          )
          VALUES
          ($1,$2,$3,$4,'blocked')
          ON CONFLICT
          (business_id, day_key, slot_start)
          DO UPDATE
          SET
            status = 'blocked',
            booking_code = NULL`,
          [
            req.params.id,
            dayKey,
            req.params.slotStart,
            slotEnd || '',
          ]
        );

        return res.json({
          ok: true,
        });
      }

      // Mark booking as late
      if (action === 'late') {
        const { rows } = await pool.query(
          `SELECT booking_code
           FROM bookings
           WHERE business_id = $1
           AND day_key = $2
           AND slot_start = $3`,
          [
            req.params.id,
            dayKey,
            req.params.slotStart,
          ]
        );

        if (!rows.length) {
          return res.status(404).json({
            error: 'Booking not found',
          });
        }

        await pool.query(
          `UPDATE bookings
           SET status = 'late'
           WHERE business_id = $1
           AND day_key = $2
           AND slot_start = $3`,
          [
            req.params.id,
            dayKey,
            req.params.slotStart,
          ]
        );

        const code = rows[0].booking_code;

        if (code) {
          const { rows: pushRows } = await pool.query(
            `SELECT subscription
             FROM customer_push_subs
             WHERE booking_code = $1`,
            [code]
          );

          if (pushRows.length) {
            await sendPush(pushRows[0].subscription, {
              title: 'Your booking is running late',
              body: `The business has marked your ${req.params.slotStart} slot as late. Please be there ASAP.`,
              data: {
                code,
              },
            });
          }
        }

        return res.json({
          ok: true,
        });
      }

      return res.status(400).json({
        error: 'Unknown action. Use block | unblock | late',
      });
    } catch (err) {
      console.error(err);

      res.status(500).json({
        error: 'Internal server error',
      });
    }
  }
);

module.exports = router;