const jsonToken = require("jsonwebtoken");
const HttpError = require("../models/httpError");

module.exports = (req, res, next) => {
  if (req.method === "OPTIONS") {
    return next();
  }
  try {
    const token = req.headers.authorization.split(" ")[1]; // Authorization: 'bearer TOKEN'
    if (!token) {
      throw new HttpError("Authentication token error!");
    }
    const decodedToken = jsonToken.verify(token, process.env.JSON_TOKEN_KEY);
    req.userData = { userId: decodedToken.userId };
    next();
  } catch (err) {
    return next(new HttpError("Authentication token error!", 401));
  }
};
