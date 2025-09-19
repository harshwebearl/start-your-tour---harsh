    const mongoose = require('mongoose');
    const SelectedDestination = require('../models/SelectedDestination');



    const SelectedDestinationSchema = new mongoose.Schema({
        category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'DestinationCategory',
            required: true
        },
        destinations: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Destination',
            required: true
        }],
        isVisible: {
            type: Boolean,
            default: false // Only visible if admin selects
        }
    }, { timestamps: true });

    module.exports = mongoose.model('SelectedDestination', SelectedDestinationSchema);

