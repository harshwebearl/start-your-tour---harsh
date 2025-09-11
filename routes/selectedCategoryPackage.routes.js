const express = require("express");
const router = express.Router();
const SelectedCategoryPackageController = require("../controllers/SelectedCategoryPackage.Controller");
const controller = new SelectedCategoryPackageController();
const auth = require("../middleware/isAuth"); // Corrected JWT auth middleware

// Admin: Set/Update selected packages for a category
router.post("/admin/category-packages", auth, (req, res) => controller.setSelectedPackages(req, res));

// User: Get selected packages per category
router.get("/category-packages", (req, res) => controller.getSelectedPackages(req, res));

module.exports = router;