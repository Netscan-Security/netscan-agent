require('dotenv').config()

// API constants
const API_URL = process.env.DEV_API_URL || "http://ec2-13-201-168-66.ap-south-1.compute.amazonaws.com:3000";
const API_TIMEOUT = 30000;

module.exports = {
    API_URL,
    API_TIMEOUT
};