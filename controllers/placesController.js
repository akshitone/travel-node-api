const fs = require("fs");
const HttpError = require("../models/httpError");
const { validationResult } = require("express-validator");
const mongoose = require("mongoose");

const getCoordinatesForAddress = require("../util/location");
const Place = require("../models/place");
const User = require("../models/user");

exports.getPlaces = async (req, res, next) => {
  let places;
  try {
    places = await Place.find();
  } catch (err) {
    return next(new HttpError("Places not found!", 500));
  }
  res.json({
    places: places.map((place) => place.toObject()),
  });
};

exports.getPlace = async (req, res, next) => {
  const placeId = req.params.placeId;
  let findPlace;
  try {
    findPlace = await Place.findById(placeId);
  } catch (err) {
    return next(new HttpError("Place not found!", 500));
  }
  if (!findPlace) {
    return next(new HttpError("Place not found", 404));
  }
  res.json({ place: findPlace.toObject() });
};

exports.getPlacesByUserId = async (req, res, next) => {
  const userId = req.params.userId;
  // let findPlaces;
  // try {
  //   findPlaces = await Place.find({ user: userId });
  // } catch (err) {
  //   return next(new HttpError("User not found!", 500));
  // }
  let userWithPlace;
  try {
    userWithPlace = await User.findById(userId).populate("places");
  } catch (err) {
    return next(new HttpError("User not found!", 500));
  }
  if (!userWithPlace || userWithPlace.places.length === 0) {
    return next(new HttpError("Places not found!", 404));
  }
  res.json({
    places: userWithPlace.places.map((place) => place.toObject()),
  });
};

exports.postPlaces = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    next(new HttpError("Invalid input data entered!", 422));
  }
  const { placename, address, description } = req.body;
  let coordinates;
  try {
    coordinates = await getCoordinatesForAddress(address);
  } catch (err) {
    return next(err);
  }
  const place = new Place({
    placename,
    address,
    description,
    coordinates,
    image: req.file.path,
    user: req.userData.userId,
  });
  let existingUser;
  try {
    existingUser = await User.findById(req.userData.userId);
  } catch (err) {
    const error = new HttpError("Creating place failed, user!", 500);
    return next(error);
  }

  if (!existingUser) {
    return next(new HttpError("User not existing!", 404));
  }

  try {
    const session = await mongoose.startSession();
    session.startTransaction();
    await place.save({ session: session });
    existingUser.places.push(place);
    await existingUser.save({ session: session });
    await session.commitTransaction();
  } catch (err) {
    console.log(err);
    const error = new HttpError("Creating place failed!", 500);
    return next(error);
  }
  res.status(201).json({ place: place });
};

exports.updatePlace = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors);
    return next(new HttpError("Invalid input data entered!", 422));
  }
  const { placename, description, address } = req.body;
  const placeId = req.params.placeId;
  let findPlace;
  try {
    findPlace = await Place.findById(placeId);
  } catch (err) {
    return next(new HttpError("Place not found!", 500));
  }

  if (findPlace.user.toString() !== req.userData.userId) {
    return next(new HttpError("Unauthorization error!", 401));
  }

  findPlace.placename = placename;
  findPlace.description = description;
  findPlace.address = address;
  try {
    await findPlace.save();
  } catch (err) {
    return next(new HttpError("Updating place failed!", 500));
  }
  res.status(200).json({ place: findPlace.toObject() });
};

exports.deletePlace = async (req, res, next) => {
  const placeId = req.params.placeId;
  let findPlace;
  try {
    findPlace = await Place.findById(placeId).populate("user");
  } catch (err) {
    return next(new HttpError("Deleting place failed!", 500));
  }
  if (!findPlace) {
    return next(new HttpError("Place not existing!", 404));
  }

  if (findPlace.user._id.toString() !== req.userData.userId) {
    return next(new HttpError("Unauthorization error!", 401));
  }

  const imagePath = findPlace.image;

  try {
    const session = await mongoose.startSession();
    session.startTransaction();
    await findPlace.remove({ session: session });
    findPlace.user.places.pull(findPlace);
    await findPlace.user.save({ session: session });
    await session.commitTransaction();
  } catch (err) {
    return next(new HttpError("Deleting place failed!", 500));
  }
  fs.unlink(imagePath, (err) => {
    console.log(err);
  });
  res.status(200).json({ message: "Place deleted!" });
};
