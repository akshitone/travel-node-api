const multer = require("multer");
var uuid = require("uuid");

const MIME_TYPE_MAP = {
  "image/png": "png",
  "image/jpeg": "jpeg",
  "image/jpg": "jpg",
};

const imageUpload = multer({
  limits: 50000,
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, "uploads/images/");
    },
    filename: (req, file, cb) => {
      const extention = MIME_TYPE_MAP[file.mimetype];
      cb(null, uuid.v4() + "." + extention);
    },
  }),
  fileFilter: (req, file, cb) => {
    const isValid = !!MIME_TYPE_MAP[file.mimetype];
    error = isValid ? null : new Error("Invalid mime type!");
    cb(error, isValid);
  },
});

module.exports = imageUpload;
