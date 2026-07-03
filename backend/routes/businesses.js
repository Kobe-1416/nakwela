// routes/businesses.js

const express = require('express');
const bcrypt = require('bcryptjs');
const { pool } = require('../db');

const router = express.Router();

// GET /api/businesses
router.get('/businesses', async (_req, res) => {
  const { rows } = await pool.query(
    `SELECT
      id,
      name,
      category,
      area,
      icon,
      open_time,
      close_time,
      phone
     FROM businesses
     ORDER BY created_at ASC`
  );

  res.json(
    rows.map((r) => ({
      id: r.id,
      name: r.name,
      category: r.category,
      area: r.area,
      icon: r.icon,
      openTime: r.open_time,
      closeTime: r.close_time,
      phone: r.phone,
    }))
  );
});

// GET /api/businesses/:id
router.get('/businesses/:id', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT
      id,
      name,
      category,
      area,
      icon,
      open_time,
      close_time,
      phone
     FROM businesses
     WHERE id = $1`,
    [req.params.id]
  );

  if (!rows.length) {
    return res.status(404).json({
      error: 'Business not found',
    });
  }

  const r = rows[0];

  res.json({
    id: r.id,
    name: r.name,
    category: r.category,
    area: r.area,
    icon: r.icon,
    openTime: r.open_time,
    closeTime: r.close_time,
    phone: r.phone,
  });
});

// POST /api/businesses
router.post('/businesses', async (req, res) => {
  const {
    name,
    category,
    area,
    openTime,
    closeTime,
    phone,
    password,
    icon,
  } = req.body;

  if (
    !name ||
    !category ||
    !area ||
    !openTime ||
    !closeTime ||
    !phone ||
    !password
  ) {
    return res.status(400).json({
      error: 'All fields including password are required',
    });
  }

  const id = 'b' + Date.now();

  const hash = await bcrypt.hash(password, 10);

  const icons = [
    '🏪',
    '🛠️',
    '✂️',
    '🍽️',
    '🚐',
    '📦',
    '🧴',
    '🧰',
  ];

  const bizIcon =
    icon ||
    icons[Math.floor(Math.random() * icons.length)];

  await pool.query(
    `INSERT INTO businesses
      (
        id,
        name,
        category,
        area,
        icon,
        open_time,
        close_time,
        phone,
        password_hash
      )
      VALUES
      ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [
      id,
      name,
      category,
      area,
      bizIcon,
      openTime,
      closeTime,
      phone,
      hash,
    ]
  );

  res.status(201).json({
    id,
    name,
    category,
    area,
    icon: bizIcon,
    openTime,
    closeTime,
    phone,
  });
});

module.exports = router;