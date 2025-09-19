const SelectedDestination = require('../models/SelectedDestination');
const Package = require('../models/PackageSchema');
const Destination = require('../models/DestinationSchema');
const DestinationCategory = require('../models/DestinationCategorySchema'); // Category model import કરો

// Admin: Get all destinations for a category
exports.getDestinationsForCategory = async (req, res) => {
    try {
        const { categoryId } = req.params;
        if (!categoryId) return res.status(400).json({ message: 'categoryId is required' });

        const selected = await SelectedDestination.findOne({ category: categoryId });
        if (!selected) return res.status(404).json({ message: 'No destinations found for this category' });

        // Fetch category details
        const category = await DestinationCategory.findById(categoryId);

        // Fetch full details for each destination in the array
        const destinations = await Destination.find({ _id: { $in: selected.destinations } });

        // Format response as per your requirement
        const formattedDestinations = destinations.map(dest => ({
            destination_id: dest._id,
            destination_name: dest.name || dest.destination_name || '',
            price: dest.price || null,
            day_night: dest.day_night || '',
            rating: dest.rating || null
        }));

        res.json({
            category_id: categoryId,
            category_name: category ? category.name : '',
            is_visible: selected.isVisible || false,
            destinations: formattedDestinations
        });
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
        const selectedDest = await SelectedDestination.findOne({
            category: categoryId,
            destinations: { $in: [destinationId] }
        });

        if (!selectedDest) return res.status(404).json({ message: 'Destination not found in this category' });

        // Get category details
        const category = await DestinationCategory.findById(categoryId);

        // Get destination details
        const destDetails = await Destination.findById(destinationId);
        const packages = await Package.find({ destination: destinationId });

        // Format response
        const response = {
            category_id: categoryId,
            category_name: category ? category.name : '',
            category_visible: selectedDest.isVisible || false,
            destination_id: destDetails._id,
            destination_name: destDetails.name || destDetails.destination_name || '',
            price: destDetails.price || null,
            day_night: destDetails.day_night || '',
            rating: destDetails.rating || null,
            packages
        };

        res.json(response);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Admin: Get all packages for all destinations in a category
exports.getPackagesForCategory = async (req, res) => {
    try {
        const { category } = req.params;
        if (!category) return res.status(400).json({ message: 'category is required' });

        // Find the selected destinations for this category
        const selectedDest = await SelectedDestination.findOne({ category });
        if (!selectedDest) return res.status(404).json({ message: 'No destinations found for this category' });

        // Get category details
        const categoryDetails = await DestinationCategory.findById(category);

        const destinationIds = selectedDest.destinations;
        const packages = await Package.find({ destination: { $in: destinationIds } });

        // Group packages by destination
        const groupedPackages = {};
        packages.forEach(pkg => {
            const destId = pkg.destination.toString();
            if (!groupedPackages[destId]) {
                groupedPackages[destId] = [];
            }
            groupedPackages[destId].push(pkg);
        });

        // Get destination details and format response
        const formattedData = [];
        for (const destId of destinationIds) {
            const destDetails = await Destination.findById(destId);
            if (destDetails) {
                formattedData.push({
                    destination_id: destDetails._id,
                    destination_name: destDetails.name || destDetails.destination_name || '',
                    price: destDetails.price || null,
                    day_night: destDetails.day_night || '',
                    rating: destDetails.rating || null,
                    packages: groupedPackages[destId.toString()] || []
                });
            }
        }

        res.json({
            category_id: category,
            category_name: categoryDetails ? categoryDetails.name : '',
            category_visible: selectedDest.isVisible || false,
            destinations: formattedData
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// User: Get all packages for a destination by destinationId
exports.getPackagesForDestination = async (req, res) => {
    try {
        const { destinationId } = req.params;
        if (!destinationId) return res.status(400).json({ message: 'destinationId is required' });

        // Fetch destination details from Destination collection
        const destination = await Destination.findById(destinationId);
        if (!destination) return res.status(404).json({ message: 'Destination not found' });

        // Find which category this destination belongs to
        const selectedDest = await SelectedDestination.findOne({
            destinations: { $in: [destinationId] }
        });

        let categoryInfo = null;
        if (selectedDest) {
            const category = await DestinationCategory.findById(selectedDest.category);
            categoryInfo = {
                category_id: selectedDest.category,
                category_name: category ? category.name : '',
                category_visible: selectedDest.isVisible || false
            };
        }

        // Fetch packages for this destination
        const packages = await Package.find({ destination: destinationId });

        // Build response object as per your exact format
        const response = {
            destination_id: destination._id.toString(),
            destination_name: destination.name || destination.destination_name || '',
            price: destination.price || null,
            day_night: destination.day_night || '',
            rating: destination.rating || null,
            category: categoryInfo,
            packages: packages || []
        };

        res.json(response);
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

        // Validate category exists
        const category = await DestinationCategory.findById(categoryId);
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        // Find or create the document for this category
        const updated = await SelectedDestination.findOneAndUpdate(
            { category: categoryId },
            {
                destinations: destinationIds,
                isVisible: isVisible !== undefined ? isVisible : false
            },
            { new: true, upsert: true }
        );

        // Fetch category details for response
        const categoryDetails = await DestinationCategory.findById(categoryId);

        res.json({
            message: 'Destinations selected/updated successfully',
            data: {
                category_id: categoryId,
                category_name: categoryDetails ? categoryDetails.name : '',
                destinations_selected: updated.destinations.length,
                is_visible: updated.isVisible,
                selected_destinations: updated
            }
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// User: Get only visible destinations with categories
exports.getVisibleDestinations = async (req, res) => {
    try {
        const visibleSelected = await SelectedDestination.find({ isVisible: true }).populate('category', 'name');

        if (!visibleSelected.length) {
            return res.json([]);
        }

        // Get all unique destination IDs from visible categories
        const allDestinationIds = visibleSelected
            .map(item => item.destinations)
            .flat();

        // Remove duplicates
        const uniqueDestinationIds = [...new Set(allDestinationIds.map(id => id.toString()))].map(id => id);

        // Fetch destination details
        const destinations = await Destination.find({
            _id: { $in: uniqueDestinationIds }
        });

        // Create response with category information and lowest-priced package for each destination
        const response = await Promise.all(visibleSelected.map(async selected => {
            return {
                category_id: selected.category._id,
                category_name: selected.category.category_name || '',
                is_visible: selected.isVisible,
                destinations: await Promise.all(
                    destinations
                        .filter(dest => selected.destinations.some(dId => dId.toString() === dest._id.toString()))
                        .map(async dest => {
                            // Find lowest-priced package for this destination
                            const lowestPackage = await Package.findOne({ destination: dest._id })
                                .sort({ 'price_and_date.price_per_person': 1 })
                                .lean();
                            let lowestPrice = null;
                            let packageDetails = null;
                            if (lowestPackage && Array.isArray(lowestPackage.price_and_date) && lowestPackage.price_and_date.length > 0) {
                                // Find the lowest price in price_and_date array
                                const minPriceObj = lowestPackage.price_and_date.reduce((min, curr) => {
                                    if (curr.price_per_person != null && (min == null || curr.price_per_person < min.price_per_person)) {
                                        return curr;
                                    }
                                    return min;
                                }, null);
                                if (minPriceObj) {
                                    lowestPrice = minPriceObj.price_per_person;
                                    packageDetails = {
                                        package_id: lowestPackage._id,
                                        package_name: lowestPackage.name,
                                        price_per_person: minPriceObj.price_per_person,
                                        child_price: minPriceObj.child_price,
                                        infant_price: minPriceObj.infant_price
                                    };
                                }
                            }
                            return {
                                destination_id: dest._id.toString(),
                                destination_name: dest.name || dest.destination_name || '',
                                price: lowestPrice,
                                package_details: packageDetails,
                                day_night: dest.day_night || '',
                                rating: dest.rating || null
                            };
                        })
                )
            };
        }));
        res.json(response);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Admin: Get all selected categories with destinations
exports.getAllSelectedCategories = async (req, res) => {
    try {
        const selectedCategories = await SelectedDestination.find()
            .populate('category', 'name')
            .populate('destinations', 'name destination_name price day_night rating');

        const formattedResponse = selectedCategories.map(selected => ({
            category_id: selected.category._id,
            category_name: selected.category.name || '',
            is_visible: selected.isVisible,
            destinations_count: selected.destinations.length,
            destinations: selected.destinations.map(dest => ({
                destination_id: dest._id.toString(),
                destination_name: dest.name || dest.destination_name || '',
                price: dest.price || null,
                day_night: dest.day_night || '',
                rating: dest.rating || null
            }))
        }));

        res.json(formattedResponse);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Helper function (not an endpoint)
exports.getDestinationIdsByCategory = async (categoryId) => {
    try {
        const results = await SelectedDestination.find({
            category: categoryId
        });
        return results.map(item => item.destinations).flat();
    } catch (err) {
        throw new Error('Failed to get destination IDs: ' + err.message);
    }
};