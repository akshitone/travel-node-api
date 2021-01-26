const express = require("express");
const router = express.Router();
const { check } = require("express-validator");
const checkAuth = require("../middleware/authToken");

const userValidation = [
  check("email").normalizeEmail().isEmail(),
  check("password").isLength({ min: 6 }),
];

const usersController = require("../controllers/usersController");
const imageUpload = require("../middleware/imageUpload");

router.get("/", usersController.getUsers);
router.get("/:userId", usersController.getUser);

router.post(
  "/signup",
  imageUpload.single("image"),
  [(userValidation, check("name").not().isEmpty())],
  usersController.signup
);
router.post("/login", userValidation, usersController.login);

module.exports = router;
