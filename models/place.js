const mongoose = require("mongoose");

const placeSchema = new mongoose.Schema({
  placename: { type: String, required: true },
  description: { type: String, required: true },
  address: { type: String, required: true },
  image: { type: String, required: true },
  coordinates: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  user: { type: mongoose.Types.ObjectId, required: true, ref: "User" },
});

module.exports = mongoose.model("Place", placeSchema);
