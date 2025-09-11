const mongoose = require("mongoose");
const DestinationCategory = require("../models/DestinationCategorySchema");

const SelectedCategoryPackageSchema = new mongoose.Schema({
    destination_category_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "DestinationCategory", // Model name, not collection name
        required: true,
        unique: true
    },
    package_ids: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Package" // Model name
        }
    ],
    updated_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User" // Use your actual user model name
    },
    updated_at: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.models.SelectedCategoryPackage || mongoose.model("SelectedCategoryPackage", SelectedCategoryPackageSchema);