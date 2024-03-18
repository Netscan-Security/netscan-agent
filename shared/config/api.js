const { create } = require("apisauce");

// local imports
const { API_URL, API_TIMEOUT } = require("../constants")

// Create the API client
const api = create({
  baseURL: API_URL,
  timeout: API_TIMEOUT,
  headers: {
    "Content-Type": "application/json",
  },
});

// export as cjs
module.exports = api;
