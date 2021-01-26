const axios = require("axios");
const HttpError = require("../models/httpError");

const API_KEY = process.env.GOOGLE_API;

async function getCoordinatesForAddress(address) {
  const response = await axios.get(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      address
    )}&key=${API_KEY}`
  );
  const data = response.data;
  if (!data || data.result == "ZERO_RESULTS") {
    const error = new HttpError("Could not find location!", 422);
    throw error;
  }
  //   const coordinates = data.results[0].geometry.location;
  coordinates = { lat: 40.7484405, lng: -73.9856644 };
  return coordinates;
}

module.exports = getCoordinatesForAddress;
