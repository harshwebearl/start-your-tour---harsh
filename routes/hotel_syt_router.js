const express = require("express");
const router = express.Router();
const hotel_controller = require("../controllers/hotel_syt_controller");
const multer = require("multer");
// const auth = require("../middleware/auth");
const hotel_controller_class = new hotel_controller();

// const storage = multer.diskStorage({
//   destination: "public/images/hotel_syt",
//   filename: function (req, file, cb) {
//     cb(null, Date.now() + file.originalname.replace(/\s+/g, ""));
//   }
// });

// const upload = multer({
//   storage: storage,
//   limits: {
//     fileSize: 1000000
//   },
//   fileFilter(req, file, cb) {
//     // console.log(file.originalname);
//     if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
//       return cb(new Error("Please upload a valid image file"));
//     }
//     cb(null, true);
//   }
// });
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/images/hotel_syt"); // Set the destination folder for uploaded files
  },
  filename: function (req, file, cb) {
    cb(null, (Date.now() + file.originalname).replace(/\s+/g, "")); // Set a unique filename for the uploaded file
  }
});

// Set the upload limits for files
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 5 // 5MB file size limit
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return cb(new Error("Please upload a valid image file"));
    }
    cb(null, true);
  }
});

router.post("/", upload.array("hotel_photo"), (req, res) => hotel_controller_class.hotel_register(req, res));
router.get("/", (req, res) => hotel_controller_class.get_hotel_register(req, res));
router.get("/user", (req, res) => hotel_controller_class.get_all_hotel_by_user(req, res));
router.get("/details", (req, res) => hotel_controller_class.get_hotel_by_id_data(req, res));
router.get("/alldata", (req, res) => hotel_controller_class.get_all_hotel_data(req, res));
router.put("/", upload.array("hotel_photo"), (req, res) => hotel_controller_class.update_hotel(req, res));
router.delete("/", (req, res) => hotel_controller_class.delete_hotel(req, res));
router.put("/status", (req, res) => hotel_controller_class.admin_change_status_hotel(req, res));

router.get("/allHotelDisplay", (req, res) => hotel_controller_class.all_hotel_display_agency(req, res))
router.get("/hotelDetailsAgency", (req, res) => hotel_controller_class.get_hotel_by_id_data_agency(req, res))
router.post("/search", (req, res) => hotel_controller_class.searchRoomHotelBooking(req, res))

module.exports = router;
