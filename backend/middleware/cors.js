// middleware/cors.js

const cors = require('cors');

const allowedOrigins = [
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  'http://localhost:3000',
  process.env.FRONTEND_URL,
].filter(Boolean);

const corsMiddleware = cors({
  origin: (origin, callback) => {
    // Allow requests with no Origin (curl, Postman, server-to-server)
    if (!origin) {
      return callback(null, true);
    }

    const allowed = allowedOrigins.some((allowedOrigin) =>
      origin.startsWith(allowedOrigin)
    );

    if (allowed) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },

  credentials: true,
});

module.exports = corsMiddleware;