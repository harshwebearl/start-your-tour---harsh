const express = require('express');
const router = express.Router();
const controller = require('../controllers/SelectedDestination.Controller');

// Admin: Select a destination for a category (only IDs)
router.post('/admin/select-destination', controller.selectDestinationForCategory);
// Admin: Get all destinations for a category
router.get('/admin/destinations/category/:categoryId', controller.getDestinationsForCategory);
// Admin: Get all packages for a specific destination under a specific category
router.get('/admin/packages/category/:categoryId/destination/:destinationId', controller.getPackagesForCategoryAndDestination);
// Admin: Get all packages for all destinations in a category
router.get('/admin/packages/category/:category', controller.getPackagesForCategory);

// User: Get only visible destinations
router.get('/user/selected-destinations', controller.getVisibleDestinations);
// User: Get all packages for a selected destination
router.get('/user/selected-destinations/:destinationId/packages', controller.getPackagesByDestination);
// User: Get all packages for a destination by destinationId
router.get('/user/packages/:destinationId', controller.getPackagesForDestination);

module.exports = router;
