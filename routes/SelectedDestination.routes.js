const express = require('express');
const router = express.Router();
const controller = require('../controllers/SelectedDestination.Controller');

// Admin Routes
router.post('/admin/select-destination', controller.selectDestinationForCategory);
router.get('/admin/destinations/category/:categoryId', controller.getDestinationsForCategory);
router.get('/admin/packages/category/:categoryId/destination/:destinationId', controller.getPackagesForCategoryAndDestination);
router.get('/admin/packages/category/:category', controller.getPackagesForCategory);
router.get('/admin/selected-categories', controller.getAllSelectedCategories); // New route for all selected categories

// User Routes
router.get('/user/selected-destinations', controller.getVisibleDestinations);
router.get('/user/destination/:destinationId/packages', controller.getPackagesForDestination);
router.get('/user/category/:categoryId/destinations', controller.getDestinationsForCategory); // User can also get by category

module.exports = router;