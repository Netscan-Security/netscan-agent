require('dotenv').config()

// API constants
const API_URL = process.env.DEV_API_URL || "http://localhost:3000";
const API_TIMEOUT = 30000;

module.exports = {
    API_URL,
    API_TIMEOUT
};