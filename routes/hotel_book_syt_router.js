const express = require("express");
const router = express.Router();
const hotel_book_syt_controller = require("../controllers/hotel_book_syt_controller");
const multer = require("multer");
// const auth = require("../middleware/auth");
const hotel_book_syt_Controller = new hotel_book_syt_controller();

router.post("/", (req, res) => hotel_book_syt_Controller.user_booked_hotel(req, res));

router.get("/", (req, res) => hotel_book_syt_Controller.user_display_booked_hotel(req, res));

router.get("/all", (req, res) => hotel_book_syt_Controller.agency_display_all_booked_hotel(req, res));

router.get("/displayAllBookedhotel", (req, res) => hotel_book_syt_Controller.admin_display_all_booked_hotel(req, res));

router.get("/hotel_book_details/:_id", (req, res) => hotel_book_syt_Controller.admin_display_Details_booked_hotel(req, res));

router.get("/detail", (req, res) => hotel_book_syt_Controller.admin_display_hotel_data_with_user_data(req, res));

router.put("/updateStatus/:hotel_booked_id", (req, res) => hotel_book_syt_Controller.hotel_status_change_api(req, res));

router.put("/cancel_status_by_user/:hotel_booked_id", (req, res) => hotel_book_syt_Controller.hotel_status_cancel_by_user(req, res));


module.exports = router;
