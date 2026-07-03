// routes/health.js

const express = require('express');

const router = express.Router();

// Health check
router.get('/health', (_req, res) => {
  res.json({ ok: true });
});

// VAPID public key
router.get('/vapid-public-key', (_req, res) => {
  res.json({
    key: process.env.VAPID_PUBLIC_KEY || null,
  });
});

module.exports = router;