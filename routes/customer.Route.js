const express = require("express");
const router = express.Router();
const UserController = require("../controllers/customer.Controller");
const userController = new UserController();

const { uploadFile } = require("../middleware/genericMulter.js");
const isAuthAllowed = require("../middleware/isAuthAllowed");
const multer = require("multer");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/images/users"); // Set the destination folder for uploaded files
  },
  filename: function (req, file, cb) {
    cb(null, (Date.now() + file.originalname).replace(/\s+/g, "")); // Set a unique filename for the uploaded file
  }
});

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
//user registration
router.post("/", (req, res) => userController.register(req, res));

router.post("/checkmobilenumber", (req, res) => userController.checkmobile_number(req, res));

//display user data
router.get("/", (req, res) => userController.getUsers(req, res));

router.get("/alluserlist", (req, res) => userController.display_all_user_list_by_admin(req, res));

router.get("/userdetail", (req, res) => userController.display_all_user_detail_by_admin(req, res));

//change password
// router.put('/:id',  (req,res) => userController.updatePassword(req,res));

router.put("/chengepassword", (req, res) => userController.forgotPassword(req, res));

router.put("/updatepassword", (req, res) => userController.updatePassword(req, res));

//delete user
router.delete("/:id", (req, res) => userController.deleteUser(req, res));

//get user info
router.get("/userprofile", (req, res) => userController.userInfo(req, res));

router.get("/history", (req, res) => userController.usershistory(req, res));

router.post("/send-otp", (req, res) => userController.send_otp(req, res));
router.post("/verify-otp", (req, res) => userController.verify_otp(req, res));

//update profile
router.put(
  "/changeprofile",
  upload.single("photo"),
  // uploadFile(
  //   // process?.env?.ACTIVE_STORAGE,
  //   "single",
  //   "photo",
  //   // [
  //   //   { name: "pancard_image", maxCount: 1 },
  //   //   { name: "agency_logo", maxCount: 1 },
  //   // ],
  //   "uploads/images/users" // ""
  // ),
  (req, res) => userController.updateProfile(req, res)
);

module.exports = router;
