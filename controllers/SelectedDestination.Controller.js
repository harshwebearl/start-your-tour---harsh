const SelectedDestination = require('../models/SelectedDestination');
const Package = require('../models/PackageSchema');

// Admin: Get all destinations for a category
exports.getDestinationsForCategory = async (req, res) => {
    try {
        const { categoryId } = req.params;
        if (!categoryId) return res.status(400).json({ message: 'categoryId is required' });
        const destinations = await SelectedDestination.find({ category: categoryId });
        res.json(destinations);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};
// Admin: Get all packages for a specific destination under a specific category
exports.getPackagesForCategoryAndDestination = async (req, res) => {
    try {
        const { categoryId, destinationId } = req.params;
        if (!categoryId || !destinationId) return res.status(400).json({ message: 'categoryId and destinationId are required' });
        // Find the destination in this category
        const destination = await SelectedDestination.findOne({ category: categoryId, _id: destinationId });
        if (!destination) return res.status(404).json({ message: 'Destination not found in this category' });
        const packages = await Package.find({ destination: destinationId });
        res.json(packages);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};
// Admin: Get all packages for all destinations in a category
exports.getPackagesForCategory = async (req, res) => {
    try {
        const { category } = req.params;
        if (!category) return res.status(400).json({ message: 'category is required' });
        // Find all destinations in this category
        const destinations = await SelectedDestination.find({ category });
        const destinationIds = destinations.map(dest => dest._id);
        // Find all packages for these destinations
        const packages = await Package.find({ destination: { $in: destinationIds } });
        res.json(packages);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};
// User: Get all packages for a destination by destinationId
exports.getPackagesForDestination = async (req, res) => {
    try {
        const { destinationId } = req.params;
        if (!destinationId) return res.status(400).json({ message: 'destinationId is required' });
        const packages = await Package.find({ destination: destinationId });
        res.json(packages);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// User: Get all packages for a selected destination
exports.getPackagesByDestination = async (req, res) => {
    try {
        const { destinationId } = req.params;
        if (!destinationId) return res.status(400).json({ message: 'destinationId is required' });
        const packages = await Package.find({ destination: destinationId });
        res.json(packages);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};



// Admin: Select destinations for a category (new schema)
exports.selectDestinationForCategory = async (req, res) => {
    try {
        const { categoryId, destinationIds, isVisible } = req.body;
        if (!categoryId || !destinationIds || !Array.isArray(destinationIds) || destinationIds.length === 0) {
            return res.status(400).json({ message: 'categoryId and destinationIds are required (destinationIds should be an array)' });
        }
        // Find or create the document for this category
        const updated = await SelectedDestination.findOneAndUpdate(
            { category: categoryId },
            { destinations: destinationIds, isVisible },
            { new: true, upsert: true }
        );
        res.json({ message: 'Destinations selected/updated', data: updated });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// User: Get only visible destinations
exports.getVisibleDestinations = async (req, res) => {
    try {
        const destinations = await SelectedDestination.find({ isVisible: true });
        res.json(destinations);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Example using Mongoose
const mongoose = require('mongoose');
async function getDestinationIdsByCategory(categoryId) {
    // If categoryId is a string, convert to ObjectId if needed
    // const catId = mongoose.Types.ObjectId(categoryId);

    const results = await SelectedDestination.find({ category: categoryId }, { _id: 0, destinationId: 1 });
    // If destinationId is stored as a field
    return results.map(item => item.destinationId);
}