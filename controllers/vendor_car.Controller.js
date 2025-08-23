const mongoose = require("mongoose");
const VendorCar = require("../models/vendor_car_schema");
const User = require("../models/usersSchema"); // Renamed for clarity
const image_url = require("../update_url_path.js");
const fn = "vendor_car";

const buildPipeline = (tokenData, userRole) => {
  const pipeline = [
    {
      $lookup: {
        from: "cars",
        localField: "car_id",
        foreignField: "_id",
        as: "car_details",
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "vendor_id",
        foreignField: "_id",
        as: "vendor_details",
      },
    },
    // Filter for available cars
    {
      $match: { isAvailable: true }, // Only show available cars
    },
  ];

  if (tokenData) {
    if (userRole === "agency") {
      pipeline.unshift({
        $match: {
          vendor_id: new mongoose.Types.ObjectId(tokenData.id),
        },
      });
    } else if (userRole !== "admin") {
      return null; // Unauthorized for non-admin, non-agency
    }
    // Admin: No additional match, shows all available cars
  } else {
    pipeline.push({
      $match: {
        isDeleted: { $ne: true },
        status: { $eq: "active" },
      },
    });
  }

  pipeline.push({ $sort: { createdAt: -1 } });

  return pipeline;
};

const formatCarData = async (vendorData) => {
  for (let car of vendorData) {
    // Convert vendor car photos
    car.photos = await Promise.all(car.photos.map((photo) => image_url(fn, photo)));

    // Convert car details photos
    if (car.car_details && car.car_details.length > 0) {
      for (let detail of car.car_details) {
        if (detail.photo) {
          detail.photo = await image_url("car_syt", detail.photo);
        }
      }
    }

    // Format vendor details (remove sensitive info)
    if (car.vendor_details && car.vendor_details.length > 0) {
      car.vendor_details = car.vendor_details.map((vendor) => ({
        name: vendor.name,
        email: vendor.email,
        phone: vendor.phone,
        address: vendor.address,
        city: vendor.city,
        state: vendor.state,
      }));
    }
  }
  return vendorData;
};

exports.getVendorCars = async (req, res) => {
  try {
    const tokenData = req.userData;

    let pipeline = buildPipeline(tokenData, tokenData ? (await User.findById(tokenData.id))?.role : null);
    if (!pipeline) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to perform this action",
      });
    }

    const vendorData = await VendorCar.aggregate(pipeline);
    await formatCarData(vendorData);

    const message = tokenData && (await User.findById(tokenData.id)).role === "agency"
      ? "Vendor cars found successfully"
      : "All cars found successfully";

    res.status(200).json({
      success: true,
      message,
      total: vendorData.length,
      data: vendorData,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

exports.getAllVendorCars = async (req, res) => {
  try {
    const tokenData = req.userData;
    if (!tokenData) {
      return res.status(401).json({
        success: false,
        message: "Authentication failed",
      });
    }

    const userData = await User.findById(tokenData.id);
    if (!userData || userData.role !== "agency") {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to perform this action",
      });
    }

    const pipeline = [
      {
        $match: {
          vendor_id: new mongoose.Types.ObjectId(tokenData.id),
          isAvailable: true, // Only available cars
        },
      },
      {
        $lookup: {
          from: "cars",
          localField: "car_id",
          foreignField: "_id",
          as: "car_details",
        },
      },
      { $sort: { _id: -1 } },
    ];

    const vendorData = await VendorCar.aggregate(pipeline);
    await formatCarData(vendorData);

    res.status(200).json({
      success: true,
      message: "Vendor cars found successfully",
      data: vendorData,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

exports.getVendorCarById = async (req, res) => {
  try {
    const { id } = req.params;

    const pipeline = [
      {
        $match: { _id: new mongoose.Types.ObjectId(id), isAvailable: true }, // Only available car
      },
      {
        $lookup: {
          from: "cars",
          localField: "car_id",
          foreignField: "_id",
          as: "car_details",
        },
      },
    ];

    const vendorData = await VendorCar.aggregate(pipeline);
    if (!vendorData || vendorData.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Vendor car not found",
      });
    }

    await formatCarData(vendorData);

    res.status(200).json({
      success: true,
      message: "Vendor car found successfully",
      data: vendorData[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

exports.createVendorCar = async (req, res) => {
  try {
    const tokenData = req.userData;
    if (!tokenData) {
      return res.status(401).json({
        success: false,
        message: "Authentication failed",
      });
    }

    const userData = await User.findById(tokenData.id);
    if (!userData || userData.role !== "agency") {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to perform this action",
      });
    }

    const existingCar = await VendorCar.findOne({
      registration_number: req.body.registration_number,
    });
    if (existingCar) {
      return res.status(403).json({
        success: false,
        message: "Registration number already exists",
      });
    }

    const newVendorCar = new VendorCar({
      car_id: req.body.car_id,
      vendor_id: tokenData.id,
      car_condition: req.body.car_condition,
      model_year: req.body.model_year,
      insurance: req.body.insurance,
      photos: req.files ? req.files.map((file) => file.filename) : [],
      registration_number: req.body.registration_number,
      color: req.body.color,
      price_per_km: req.body.price_per_km,
      min_price_per_day: req.body.min_price_per_day,
      pincode: req.body.pincode,
      city: req.body.city,
      state: req.body.state,
      outStateAllowed: req.body.outStateAllowed,
      AC: req.body.AC,
      isAvailable: true, // Default to available
    });

    const result = await newVendorCar.save();
    res.status(200).json({
      success: true,
      message: "Vendor car created successfully",
      data: result,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

exports.deleteVendorCar = async (req, res) => {
  try {
    const tokenData = req.userData;
    if (!tokenData) {
      return res.status(401).json({
        success: false,
        message: "Authentication failed",
      });
    }

    const userData = await User.findById(tokenData.id);
    if (!userData || userData.role !== "agency") {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to perform this action",
      });
    }

    const vendorCar = await VendorCar.findById(req.params.id);
    if (!vendorCar) {
      return res.status(404).json({
        success: false,
        message: "Vendor car not found",
      });
    }

    await vendorCar.remove();
    res.status(200).json({
      success: true,
      message: "Vendor car deleted successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

exports.updateVendorCar = async (req, res) => {
  try {
    const tokenData = req.userData;
    if (!tokenData) {
      return res.status(401).json({
        success: false,
        message: "Authentication failed",
      });
    }

    const userData = await User.findById(tokenData.id);
    if (!userData || userData.role !== "agency") {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to perform this action",
      });
    }

    const { venderCarId } = req.params;

    const updateData = {
      car_id: req.body.car_id,
      car_condition: req.body.car_condition,
      model_year: req.body.model_year,
      insurance: req.body.insurance,
      registration_number: req.body.registration_number,
      color: req.body.color,
      price_per_km: req.body.price_per_km,
      min_price_per_day: req.body.min_price_per_day,
      pincode: req.body.pincode,
      city: req.body.city,
      state: req.body.state,
      outStateAllowed: req.body.outStateAllowed,
      AC: req.body.AC,
      isAvailable: req.body.isAvailable !== undefined ? req.body.isAvailable : true, // Optional update
    };

    // Handle existing and new images
    let prevImages = Array.isArray(req.body.previmages)
      ? req.body.previmages
      : req.body.previmages
      ? [req.body.previmages]
      : [];
    const baseUrl = "https://start-your-tour-api.onrender.com/images/vendor_car/";
    prevImages = prevImages
      .filter(Boolean)
      .map((img) => (img.startsWith(baseUrl) ? img.replace(baseUrl, "") : img));

    const newImages = req.files ? req.files.map((file) => file.filename) : [];
    updateData.photos = [...prevImages, ...newImages];

    const updatedData = await VendorCar.findByIdAndUpdate(venderCarId, updateData, {
      new: true,
    });

    if (!updatedData) {
      return res.status(404).json({
        success: false,
        message: "Vendor car not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Vendor car updated successfully",
      data: updatedData,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

exports.adminVendorCarList = async (req, res) => {
  try {
    const tokenData = req.userData;
    if (!tokenData) {
      return res.status(401).json({
        success: false,
        message: "Authentication failed",
      });
    }

    const userData = await User.findById(tokenData.id);
    if (!userData || userData.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to perform this action",
      });
    }

    const { vendor_id } = req.query;
    if (!vendor_id) {
      return res.status(400).json({
        success: false,
        message: "Vendor ID is required",
      });
    }

    const pipeline = [
      {
        $match: {
          vendor_id: new mongoose.Types.ObjectId(vendor_id),
          isAvailable: true, // Only available cars
        },
      },
      {
        $lookup: {
          from: "cars",
          localField: "car_id",
          foreignField: "_id",
          as: "car_details",
        },
      },
      { $sort: { createdAt: -1 } },
    ];

    const adminDisplayList = await VendorCar.aggregate(pipeline);
    await formatCarData(adminDisplayList);

    res.status(200).json({
      success: true,
      message: "Vendor car list retrieved successfully",
      data: adminDisplayList,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
