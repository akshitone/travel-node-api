const express = require("express");
const router = express.Router();
const { check } = require("express-validator");
const checkAuth = require("../middleware/authToken");

placeValidation = [
  check("placename").not().isEmpty(),
  check("description").isLength({ min: 5 }),
  check("address").not().isEmpty(),
];

const placesController = require("../controllers/placesController");
const imageUpload = require("../middleware/imageUpload");

router.get("/", placesController.getPlaces);
router.get("/user/:userId", placesController.getPlacesByUserId);
router.get("/:placeId", placesController.getPlace);

router.use(checkAuth);

router.post(
  "/",
  imageUpload.single("image"),
  placeValidation,
  placesController.postPlaces
);
router.patch("/:placeId", placeValidation, placesController.updatePlace);
router.delete("/:placeId", placesController.deletePlace);

module.exports = router;
