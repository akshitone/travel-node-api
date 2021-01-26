const HttpError = require("../models/httpError");
const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jsonToken = require("jsonwebtoken");

const User = require("../models/user");

exports.getUsers = async (req, res, next) => {
  let users;
  try {
    users = await User.find({}, "-password");
  } catch (err) {
    return next(new HttpError("Users not found!", 500));
  }
  res.json({
    users: users.map((place) => place.toObject()),
  });
};

exports.getUser = async (req, res, next) => {
  const userId = req.params.userId;
  let findUser;
  try {
    findUser = await User.findById(userId);
  } catch (err) {
    return next(new HttpError("Place not found!", 500));
  }
  if (!findUser) {
    return next(new HttpError("Place not found", 404));
  }
  res.json({ user: findUser.toObject() });
};

exports.signup = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new HttpError("Invalid input data entered!", 422));
  }
  const { name, email, password } = req.body;
  let hasEmail;
  try {
    hasEmail = await User.findOne({ email: email });
  } catch (err) {
    return next(new HttpError("Please try again later!", 500));
  }

  if (hasEmail) {
    return next(new HttpError("Email already exist!", 422));
  }

  let hashedPassword;
  try {
    hashedPassword = await bcrypt.hash(password, 12);
  } catch (err) {
    return next(new HttpError("Password error!", 500));
  }

  const user = new User({
    name,
    email,
    password: hashedPassword,
    image: req.file.path,
    places: [],
  });

  try {
    await user.save();
  } catch (err) {
    const error = new HttpError("Signing up failed!", 500);
    return next(error);
  }

  let token;
  try {
    token = jsonToken.sign(
      { userId: user._id, email: user.email },
      process.env.JSON_TOKEN_KEY,
      { expiresIn: "1h" }
    );
  } catch (err) {
    const error = new HttpError("Signing up failed!", 500);
    return next(error);
  }

  res.status(201).json({ userId: user._id, email: user.email, token: token });
};

exports.login = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new HttpError("Invalid input data entered!", 422));
  }
  const { email, password } = req.body;

  let findUser;
  try {
    findUser = await User.findOne({ email: email });
  } catch (err) {
    return next(new HttpError("Please try again later!", 500));
  }

  if (!findUser) {
    return next(new HttpError("Credentials seem to be wrong!", 401));
  }

  let isValidPassword = false;
  try {
    isValidPassword = await bcrypt.compare(password, findUser.password);
  } catch (err) {
    return next(new HttpError("Password error!", 500));
  }

  if (!isValidPassword) {
    return next(new HttpError("Credentials seem to be wrong!", 401));
  }

  let token;
  try {
    token = jsonToken.sign(
      { userId: findUser._id, email: findUser.email },
      process.env.JSON_TOKEN_KEY,
      { expiresIn: "1h" }
    );
  } catch (err) {
    const error = new HttpError("Logging in failed!", 500);
    return next(error);
  }

  res
    .status(200)
    .json({ userId: findUser._id, email: findUser.email, token: token });
};
