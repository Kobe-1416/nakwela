// config.js

const API_URL =
  location.hostname === "localhost" ||
  location.hostname === "127.0.0.1"
    ? "http://localhost:3000/api"
    : "http://192.168.234.147:3000/api";