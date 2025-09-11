const SelectedCategoryPackage = require("../models/SelectedCategoryPackage");
const Package = require("../models/packageSchema");
const DestinationCategory = require("../models/DestinationCategorySchema");
const Forbidden = require("../errors/Forbidden");
const NotFound = require("../errors/NotFound");
const mongoose = require("mongoose");

module.exports = class SelectedCategoryPackageController {
    // Admin: Set/Update selected packages for a category
    async setSelectedPackages(req, res) {
        try {
            console.log("req.body:", req.body);
            const { destination_category_id, package_ids } = req.body;
            if (!destination_category_id) {
                return res.status(400).json({ success: false, message: "destination_category_id is required" });
            }
            const user = req.userData;
            if (!user || user.role !== "admin") throw new Forbidden("Only admin can update");

            // Ensure category exists
            let objectId;
            try {
                objectId = new mongoose.Types.ObjectId(destination_category_id);
            } catch (e) {
                return res.status(400).json({ success: false, message: "Invalid category ID" });
            }

            // Debug: Try direct MongoDB collection fetch
            const raw = await mongoose.connection.db.collection('destination_categories').findOne({ _id: objectId });
            console.log("Raw from collection:", raw);

            // Try via Mongoose model
            const destinationCategory = await DestinationCategory.findOne({ _id: objectId });
            console.log("destinationCategory found (findOne):", destinationCategory);

            if (!destinationCategory) {
                return res.status(404).json({ success: false, message: "Category not found" });
            }

            // Ensure all packages exist and are active (status: true)
            const packages = await Package.find({
                _id: { $in: package_ids },
                destination_category_id,
                status: true
            });
            if (packages.length !== package_ids.length) {
                throw new NotFound("Some packages not found in this category or are inactive");
            }

            // Upsert (update or create)
            const doc = await SelectedCategoryPackage.findOneAndUpdate(
                { destination_category_id },
                { package_ids, updated_by: user.id, updated_at: new Date() },
                { upsert: true, new: true }
            );

            res.json({ success: true, data: doc });
        } catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    }

    // User: Get selected packages per category
    async getSelectedPackages(req, res) {
        try {
            const { categoryId } = req.query;
            let filter = {};
            if (categoryId) {
                let objectId;
                try {
                    objectId = new mongoose.Types.ObjectId(categoryId);
                } catch (e) {
                    return res.status(400).json({ success: false, message: "Invalid category ID" });
                }
                const category = await DestinationCategory.findById(objectId);
                if (!category) {
                    return res.status(404).json({
                        success: false,
                        message: "Category not found"
                    });
                }
                filter.destination_category_id = categoryId;
            }
            const data = await SelectedCategoryPackage.find(filter);
            res.json({ success: true, data });
        } catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    }

    // Update category by ID
    async updateCategory(req, res) {
        try {
            let objectId;
            try {
                objectId = new mongoose.Types.ObjectId(req.params.id);
            } catch (e) {
                return res.status(400).json({ success: false, message: "Invalid category ID" });
            }
            const updatedCategory = await DestinationCategory.findOneAndUpdate(
                { _id: objectId },
                req.body,
                { new: true }
            );
            if (!updatedCategory) {
                return res.status(404).json({
                    success: false,
                    message: "Category not found"
                });
            }
            res.json({
                success: true,
                data: updatedCategory
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: "Server error",
                error: error.message
            });
        }
    }

    // Debug: List all collections
    async test(req, res) {
        try {
            console.log("All collections:", await mongoose.connection.db.listCollections().toArray());
            res.json({ success: true });
        } catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    }
};