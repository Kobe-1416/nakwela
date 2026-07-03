// config.js

const API_URL =
  location.hostname === "localhost" ||
  location.hostname === "127.0.0.1"
    ? "http://localhost:3000/api"
    : "https://township-booking.onrender.com/api";