// server.js

require('dotenv').config();

const express = require('express');
const { initSchema } = require('./db');

const corsMiddleware = require('./middleware/cors');

const healthRoutes = require('./routes/health');
const businessRoutes = require('./routes/businesses');
const authRoutes = require('./routes/auth');
const bookingRoutes = require('./routes/bookings');
const pushRoutes = require('./routes/push');
const webhookRoutes = require('./routes/wa-webhook');
const cleanupRoutes = require('./routes/cleanup');



const app = express();
const PORT = process.env.PORT || 3000;

// ────────────────────────────────────────────────────────────
// Middleware
// ────────────────────────────────────────────────────────────

app.use(corsMiddleware);
app.use(express.json());

// ────────────────────────────────────────────────────────────
// Routes
// ────────────────────────────────────────────────────────────

app.use('/api', healthRoutes);
app.use('/api', businessRoutes);
app.use('/api', authRoutes);
app.use('/api', bookingRoutes);
app.use('/api', pushRoutes);
app.use('/api', webhookRoutes);
app.use('/api', cleanupRoutes);

// ────────────────────────────────────────────────────────────
// 404 Handler
// ────────────────────────────────────────────────────────────

app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
  });
});

// ────────────────────────────────────────────────────────────
// Global Error Handler
// ────────────────────────────────────────────────────────────

app.use((err, req, res, next) => {
  console.error(err);

  res.status(500).json({
    error: err.message || 'Internal server error',
  });
});

// ────────────────────────────────────────────────────────────
// Start Server
// ────────────────────────────────────────────────────────────

initSchema()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Township Slots API running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });