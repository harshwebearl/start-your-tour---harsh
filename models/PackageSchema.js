const mongoose = require("mongoose");

const PackageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },

    price_and_date: [
      {
        price_start_date: { type: Date, required: true },
        price_end_date: { type: Date, required: true },
        price_per_person: { type: Number, required: true },
        child_price: { type: Number, default: 0 },
        infant_price: { type: Number, default: 0 }
      }
    ],

    total_days: { type: Number, required: true },
    total_nights: { type: Number, required: true },

    destination: { type: mongoose.Schema.Types.ObjectId, ref: "Destination" },

    destination_category_id: [
      { type: mongoose.Schema.Types.ObjectId, ref: "DestinationCategory" }
    ],

    meal_required: { type: [String], default: [] }, // e.g. ["breakfast","lunch"]
     meal_type: {
      type: String
      // required: true //0=nonveg , 1=veg,any
    },

    travel_by: { type: String }, // e.g. flight, train, bus
    sightseeing: { type: String },
    hotel_type: { type: [String], default: [] }, // e.g. ["3-star", "4-star"]

    more_details: { type: String },

    place_to_visit_id: { type: mongoose.Schema.Types.ObjectId, ref: "Place" },

    include_service: { type: [String], default: [] },
    exclude_service: { type: [String], default: [] },

    start_date: { type: Date },
    end_date: { type: Date },

    room_sharing: { type: String }, // e.g. single, double, triple
    package_type: { type: String }, // e.g. group, honeymoon, family

    lunch_price: { type: Number, default: 0 },
    dinner_price: { type: Number, default: 0 },
    breakfast_price: { type: Number, default: 0 },

    lunch: { type: Boolean, default: false },
    dinner: { type: Boolean, default: false },
    breakfast: { type: Boolean, default: false },

    status: {
      type: Boolean,
      default: true // true = active, false = blocked
    },

    package_valid_till_for_booking: { type: Date }
  },
  {
    timestamps: true
  }
);

// Prevent OverwriteModelError
module.exports = mongoose.models.Package || mongoose.model("Package", PackageSchema);
