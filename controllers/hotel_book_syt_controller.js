const BaseController = require("./BaseController");
const Forbidden = require("../errors/Forbidden");
const NotFound = require("../errors/NotFound");
const userSchema = require("../models/usersSchema");
const hotel_booking_syt_Schema = require("../models/hotel_booking_syt_schema");
const hotel_model = require("../models/hotel_syt_schema");
const mongoose = require("mongoose");
const image_url = require("../update_url_path.js");
const { getReceiverSocketId, io } = require("../socket/socket.js");
const package_profit_margin = require("../models/package_profit_margin.js");
const BASE_URL = "https://start-your-tour-harsh.onrender.com/images/hotel_syt/";
const BASE_URL1 = "https://start-your-tour-harsh.onrender.com/images/room_syt/";

module.exports = class hotel_book_syt_Controller extends BaseController {
  async user_booked_hotel(req, res) {
    try {
      const tokenData = req.userData;
      if (tokenData === "") {
        return res.status(401).json({
          message: "Auth fail"
        });
      }
      const userData = await userSchema.find({ _id: tokenData.id });
      if (userData[0].role !== "customer") {
        throw new Forbidden("you are not customer");
      }

      let userId = tokenData.id;

      const currentDate = new Date();
      const monthNames = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December"
      ];
      const currentMonth = monthNames[currentDate.getMonth()];

      let admin_margin_percentage = null;
      let admin_margin_price_adult = null;
      let admin_margin_price_child = null;

      const packageMargin = await package_profit_margin.findOne({ state_name: req.body.state }); // Use optional chaining in case destinationData is null

      if (packageMargin && packageMargin.month_and_margin_user) {
        const marginObj = packageMargin.month_and_margin_user.find((margin) => margin.month_name === currentMonth);

        if (marginObj) {
          const percentage = marginObj.margin_percentage / 100;
          const marginPercentagePriceForAdult = req.body.price_per_person_adult * percentage;
          const marginPercentagePriceForChild = req.body.price_per_person_child * percentage;

          admin_margin_percentage = marginObj.margin_percentage;
          admin_margin_price_adult = Math.round(marginPercentagePriceForAdult);
          admin_margin_price_child = Math.round(marginPercentagePriceForChild);
        } else {
          // If margin for current month is not found, set admin margin to 0
          const percentage = 10 / 100;
          const marginPercentagePriceForAdult = req.body.price_per_person_adult * percentage;
          const marginPercentagePriceForChild = req.body.price_per_person_child * percentage;

          admin_margin_percentage = 10;
          admin_margin_price_adult = Math.round(marginPercentagePriceForAdult);
          admin_margin_price_child = Math.round(marginPercentagePriceForChild);
        }
      } else {
        // If no packageMargin found, set admin margin to 0
        const percentage = 10 / 100;
        const marginPercentagePriceForAdult = req.body.price_per_person_adult * percentage;
        const marginPercentagePriceForChild = req.body.price_per_person_child * percentage;

        admin_margin_percentage = 10;
        admin_margin_price_adult = Math.round(marginPercentagePriceForAdult);
        admin_margin_price_child = Math.round(marginPercentagePriceForChild);
      }

      const booked_data = {
        hotel_id: req.body.hotel_id,
        room_id: req.body.room_id,
        total_booked_rooms: req.body.total_booked_rooms,
        check_in_date: req.body.check_in_date,
        check_out_date: req.body.check_out_date,
        date_time: req.body.date_time,
        total_adult: req.body.total_adult,
        total_child: req.body.total_child,
        // bed_type: req.body.bed_type,
        payment_type: req.body.payment_type,
        user_id: userId,
        status: "pending",
        //add field
        room_title: req.body.room_title,
        price: req.body.price,
        user_name: req.body.user_name,
        gender: req.body.gender,
        country: req.body.country,
        state: req.body.state,
        city: req.body.city,
        dob: req.body.bod,
        contact_no: req.body.contact_no,
        price_per_person_adult: req.body.price_per_person_adult,
        price_per_person_child: req.body.price_per_person_child,
        admin_margin_percentage: admin_margin_percentage,
        admin_margin_price_adult: admin_margin_price_adult,
        admin_margin_price_child: admin_margin_price_child
      };

      const receiverSocketId = getReceiverSocketId(userId);

      console.log("Socket connected.....: ", receiverSocketId);

      if (receiverSocketId) {
        io.to(receiverSocketId).emit("newBooking", booked_data);
      }

      const new_booked_hotel = new hotel_booking_syt_Schema(booked_data);

      const result = await new_booked_hotel.save();

      if (result.length == 0) {
        throw new Forbidden("Unable to Book Hotel ! PLease try again");
      }

      return this.sendJSONResponse(
        res,
        "Hotel Booked Succesfully!",
        {
          length: 1
        },
        result
      );
    } catch (error) {
      if (error instanceof NotFound) {
        throw error;
      }
      return this.sendErrorResponse(req, res, error);
    }
  }

  async user_display_booked_hotel(req, res) {
    try {
      const tokenData = req.userData;
      if (tokenData === "") {
        return res.status(401).json({
          message: "Auth fail"
        });
      }
      const userData = await userSchema.find({ _id: tokenData.id });
      if (userData[0].role !== "customer") {
        throw new Forbidden("you are not customer");
      }

      console.log("dsad");
      // const booked_data = await hotel_booking_syt_Schema.find({ user_id: tokenData.id });

      const booked_data = await hotel_booking_syt_Schema.aggregate([
        {
          $match: {
            user_id: mongoose.Types.ObjectId(tokenData.id),
            status: { $in: ["booked", "approve"] }
          }
        },
        {
          $lookup: {
            from: "hotel_syts",
            localField: "hotel_id",
            foreignField: "_id",
            as: "hotel_details"
          }
        },
        {
          $unwind: {
            path: "$hotel_details",
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $addFields: {
            "hotel_details.hotel_photo": {
              $arrayElemAt: ["$hotel_details.hotel_photo", 0] // Extract the first photo
            }
          }
        },
        {
          $project: {
            "_id": 1,
            "hotel_id": 1,
            "room_id": 1,
            "total_booked_rooms": 1,
            "user_id": 1,
            "transaction_id": 1,
            "check_in_date": 1,
            "check_out_date": 1,
            "date_time": 1,
            "total_adult": 1,
            "total_child": 1,
            "payment_type": 1,
            "status": 1,
            "room_title": 1,
            "price": 1,
            "user_name": 1,
            "gender": 1,
            "country": 1,
            "gst_price": 1,
            "state": 1,
            "city": 1,
            "contact_no": 1,
            "admin_margin_percentage": 1,
            "admin_margin_price_adult": 1,
            "admin_margin_price_child": 1,
            "price_per_person_adult": 1,
            "price_per_person_child": 1,
            "travel_details": 1,
            "booktype": "hotel",
            "breakfast": 1,
            "lunch": 1,
            "dinner": 1,
            "breakfast_price": 1,
            "lunch_price": 1,
            "dinner_price": 1,
            "hotel_details._id": 1,
            "hotel_details.hotel_name": 1,
            "hotel_details.hotel_address": 1,
            "hotel_details.hotel_photo": 1
          }
        }
      ]);

      // Add BASE_URL to the photo URL
      booked_data.forEach((booking) => {
        if (booking.hotel_details && booking.hotel_details.hotel_photo) {
          booking.hotel_details.hotel_photo = BASE_URL + booking.hotel_details.hotel_photo;
        }
      });

      if (booked_data.length == 0) {
        throw new Forbidden("You Have not booked any hotel");
      }

      return this.sendJSONResponse(
        res,
        "Hotel Data!",
        {
          length: 1
        },
        booked_data
      );
    } catch (error) {
      if (error instanceof NotFound) {
        throw error;
      }
      return this.sendErrorResponse(req, res, error);
    }
  }

  async agency_display_all_booked_hotel(req, res) {
    try {
      const tokenData = req.userData;
      if (tokenData === "") {
        return res.status(401).json({
          message: "Auth fail"
        });
      }
      const userData = await userSchema.find({ _id: tokenData.id });
      if (userData[0].role !== "admin" && userData[0].role !== "agency") {
        throw new Forbidden("you are not admin and agency");
      }

      const hotelData = await hotel_model.find({ user_id: tokenData.id });

      console.log(hotelData);

      // Extract only the IDs
      const hotelDataIds = hotelData.map((hotel) => hotel._id);

      console.log("abc.......", hotelDataIds);

      const booked_data = await hotel_booking_syt_Schema.aggregate([
        {
          $match: {
            hotel_id: { $in: hotelDataIds },
            status: { $in: ["booked", "approve", "reject"] }
          }
        },
        {
          $lookup: {
            from: "hotel_syts",
            localField: "hotel_id",
            foreignField: "_id",
            as: "hotel_details"
          }
        },
        {
          $lookup: {
            from: "room_syts",
            localField: "room_id",
            foreignField: "_id",
            as: "room_details"
          }
        },
        {
          $sort: { createdAt: -1 }
        },
        {
          $project: {
            "_id": 1,
            "hotel_id": 1,
            "room_id": 1,
            "total_booked_rooms": 1,
            "user_id": 1,
            "transaction_id": 1,
            "check_in_date": 1,
            "check_out_date": 1,
            "date_time": 1,
            "total_adult": 1,
            "total_child": 1,
            // "bed_type": 1,
            "payment_type": 1,
            "status": 1,
            "room_title": 1,
            "price": 1,
            "user_name": 1,
            "gender": 1,
            "country": 1,
            "state": 1,
            "gst_price": 1,
            "city": 1,
            "dob": 1,
            "admin_margin_price_child": 1,
            "admin_margin_price_adult": 1,
            "admin_margin_percentage": 1,
            "price_per_person_adult": 1,
            "price_per_person_child": 1,
            "contact_no": 1,
            "createdAt": 1,
            "updatedAt": 1,
            "__v": 1,
            "breakfast": 1,
            "lunch": 1,
            "dinner": 1,
            "breakfast_price": 1,
            "lunch_price": 1,
            "dinner_price": 1,
            "hotel_details._id": 1,
            "hotel_details.hotel_name": 1,
            "hotel_details.hotel_address": 1,
            "room_details._id": 1,
            "room_details.room_title": 1,
            "room_details.photos": 1,
            "room_details.price": 1,
            "room_details.othere_future_agency": 1,
            "travel_details": 1
          }
        }
      ]);

      if (booked_data.length == 0) {
        throw new Forbidden("No Booked Hotel Found");
      }

      for (let j = 0; j < booked_data[0].room_details.length; j++) {
        for (let k = 0; k < booked_data[0].room_details[j].photos.length; k++) {
          booked_data[0].room_details[j].photos[k] = await image_url(
            "room_syt",
            booked_data[0].room_details[j].photos[k]
          );
        }
      }

      return this.sendJSONResponse(
        res,
        "Hotel Booked Data!",
        {
          length: 1
        },
        booked_data
      );
    } catch (error) {
      if (error instanceof NotFound) {
        throw error;
      }
      return this.sendErrorResponse(req, res, error);
    }
  }

  async admin_display_all_booked_hotel(req, res) {
    try {
      const tokenData = req.userData;
      if (tokenData === "") {
        return res.status(401).json({
          message: "Auth fail"
        });
      }
      const userData = await userSchema.find({ _id: tokenData.id });
      if (userData[0].role !== "admin") {
        throw new Forbidden("you are not admin");
      }

      const booked_data = await hotel_booking_syt_Schema.aggregate([
        {
          $match: { status: { $in: ["booked", "approve", "reject"] } }
        },
        {
          $lookup: {
            from: "hotel_syts",
            localField: "hotel_id",
            foreignField: "_id",
            as: "hotel_details"
          }
        },
        {
          $lookup: {
            from: "room_syts",
            localField: "room_id",
            foreignField: "_id",
            as: "room_details"
          }
        },
        {
          $sort: { createdAt: -1 }
        },
        {
          $addFields: {
            "hotel_details.hotel_photo": {
              $arrayElemAt: ["$hotel_details.hotel_photo", 0] // Extract the first photo
            }
          }
        },
        {
          $project: {
            "_id": 1,
            "hotel_id": 1,
            "room_id": 1,
            "total_booked_rooms": 1,
            "user_id": 1,
            "check_in_date": 1,
            "check_out_date": 1,
            "transaction_id": 1,
            "date_time": 1,
            "total_adult": 1,
            "total_child": 1,
            // "bed_type": 1,
            "payment_type": 1,
            "status": 1,
            "room_title": 1,
            "price": 1,
            "user_name": 1,
            "gender": 1,
            "gst_price": 1,
            "country": 1,
            "state": 1,
            "city": 1,
            "dob": 1,
            "breakfast": 1,
            "lunch": 1,
            "dinner": 1,
            "breakfast_price": 1,
            "lunch_price": 1,
            "dinner_price": 1,
            "admin_margin_price_child": 1,
            "admin_margin_price_adult": 1,
            "admin_margin_percentage": 1,
            "price_per_person_adult": 1,
            "price_per_person_child": 1,
            "contact_no": 1,
            "createdAt": 1,
            "updatedAt": 1,
            "__v": 1,
            "hotel_details._id": 1,
            "hotel_details.hotel_name": 1,
            "hotel_details.hotel_address": 1,
            "hotel_details.hotel_photo": 1,
            "room_details._id": 1,
            "room_details.room_title": 1,
            "room_details.photos": 1,
            "room_details.price": 1,
            "room_details.othere_future_agency": 1,
            "travel_details": 1
          }
        }
      ]);

      if (booked_data.length == 0) {
        throw new Forbidden("No Booked Hotel Found");
      }

      booked_data.forEach((booking) => {
        if (booking.hotel_details && booking.hotel_details[0]?.hotel_photo) {
          booking.hotel_details[0].hotel_photo = booking.hotel_details[0].hotel_photo.map((photo) => BASE_URL + photo);
        }

        if (booking.room_details && booking.room_details[0]?.photos) {
          booking.room_details[0].photos = booking.room_details[0].photos.map((photo) => BASE_URL1 + photo);
        }
      });

      return this.sendJSONResponse(
        res,
        "Hotel Booked Data!",
        {
          length: 1
        },
        booked_data
      );
    } catch (error) {
      if (error instanceof NotFound) {
        throw error;
      }
      return this.sendErrorResponse(req, res, error);
    }
  }

  // async admin_display_Details_booked_hotel(req, res) {
  //   try {
  //     const tokenData = req.userData;
  //     if (tokenData === "") {
  //       return res.status(401).json({
  //         message: "Auth fail"
  //       });
  //     }
  //     const userData = await userSchema.find({ _id: tokenData.id });
  //     if (userData[0].role !== "admin" && userData[0].role !== 'agency') {
  //       throw new Forbidden("you are not admin and agency");
  //     }

  //     let _id = req.params._id

  //     const booked_data = await hotel_booking_syt_Schema.aggregate([
  //       {
  //         $match: { _id: new mongoose.Types.ObjectId(_id) }
  //       },
  //       {
  //         $lookup: {
  //           from: "hotel_syts",
  //           localField: "hotel_id",
  //           foreignField: "_id",
  //           as: "hotel_details"
  //         }
  //       },
  //       {
  //         $lookup: {
  //           from: "room_syts",
  //           localField: "room_id",
  //           foreignField: "_id",
  //           as: "room_details"
  //         }
  //       },
  //       {
  //         $lookup: {
  //           from: "users",
  //           localField: "user_id",
  //           foreignField: "_id",
  //           as: "users"
  //         }
  //       },
  //       {
  //         $lookup: {
  //           from: "customers",
  //           localField: "user_id",
  //           foreignField: "users.user_id",
  //           as: "users_details"
  //         }
  //       },
  //       {
  //         $project: {
  //           "_id": 1,
  //           "hotel_id": 1,
  //           "room_id": 1,
  //           "total_booked_rooms": 1,
  //           "user_id": 1,
  //           "check_in_date": 1,
  //           "check_out_date": 1,
  //           "date_time": 1,
  //           "total_adult": 1,
  //           "total_child": 1,
  //           // "bed_type": 1,
  //           "payment_type": 1,
  //           "status": 1,
  //           "createdAt": 1,
  //           "updatedAt": 1,
  //           "__v": 1,

  //           'users._id': 1,
  //           'users.phone': 1,
  //           'users_details.name': 1,
  //           'users_details.email_address': 1,
  //           'users_details.gender': 1,
  //           'users_details.state': 1,
  //           'users_details.city': 1,
  //           'users_details.photo': 1,

  //           "hotel_details._id": 1,
  //           "hotel_details.hotel_name": 1,
  //           "hotel_details.hotel_address": 1,
  //           "room_details._id": 1,
  //           "room_details.room_title": 1,
  //           "room_details.photos": 1,
  //           "room_details.price": 1
  //         }
  //       }
  //     ]);

  //     if (booked_data.length == 0) {
  //       throw new Forbidden("No Booked Hotel Found");
  //     }

  //     return this.sendJSONResponse(
  //       res,
  //       "Hotel Booked Data!",
  //       {
  //         length: 1
  //       },
  //       booked_data
  //     );
  //   } catch (error) {
  //     if (error instanceof NotFound) {
  //       throw error;
  //     }
  //     return this.sendErrorResponse(req, res, error);
  //   }
  // }

  // async admin_display_Details_booked_hotel(req, res) {
  //   try {
  //     const tokenData = req.userData;
  //     if (!tokenData) {
  //       return res.status(401).json({
  //         message: "Auth fail"
  //       });
  //     }
  //     const userData = await userSchema.findById(tokenData.id);
  //     if (userData.role !== "admin" && userData.role !== 'agency' && userData.role !== 'customer') {
  //       throw new Forbidden("you are not admin or agency or customer");
  //     }

  //     let _id = req.params._id;

  //     const booked_data = await hotel_booking_syt_Schema.aggregate([
  //       {
  //         $match: { _id: new mongoose.Types.ObjectId(_id) }
  //       },
  //       {
  //         $lookup: {
  //           from: "hotel_syts",
  //           localField: "hotel_id",
  //           foreignField: "hotel_id",
  //           as: "hotel_details"
  //         }
  //       },
  //       {
  //         $lookup: {
  //           from: "transactions",
  //           localField: "hotel_id",
  //           foreignField: "hotel_id", // Assuming hotel_id exists in transactions collection
  //           as: "transaction_details" // Change to plural if multiple transactions
  //         }
  //       },
  //       {
  //         $lookup: {
  //           from: "room_syts",
  //           localField: "room_id",
  //           foreignField: "_id",
  //           as: "room_details"
  //         }
  //       },
  //       {
  //         $lookup: {
  //           from: "users",
  //           localField: "user_id",
  //           foreignField: "_id",
  //           as: "users"
  //         }
  //       },
  //       {
  //         $unwind: "$users"
  //       },
  //       {
  //         $lookup: {
  //           from: "customers",
  //           localField: "users._id",
  //           foreignField: "user_id",
  //           as: "customer_details"
  //         }
  //       },
  //       {
  //         $unwind: {
  //           path: "$customer_details",
  //           preserveNullAndEmptyArrays: true
  //         }
  //       },
  //       {
  //         $addFields: {
  //           "users.customer_details": "$customer_details"
  //         }
  //       },
  //       {
  //         $group: {
  //           _id: "$_id",
  //           hotel_id: { $first: "$hotel_id" },
  //           room_id: { $first: "$room_id" },
  //           total_booked_rooms: { $first: "$total_booked_rooms" },
  //           user_id: { $first: "$user_id" },
  //           check_in_date: { $first: "$check_in_date" },
  //           check_out_date: { $first: "$check_out_date" },
  //           date_time: { $first: "$date_time" },
  //           total_adult: { $first: "$total_adult" },
  //           total_child: { $first: "$total_child" },
  //           payment_type: { $first: "$payment_type" },
  //           status: { $first: "$status" },
  //           room_title: { $first: "$room_title" },
  //           price: { $first: "$price" },
  //           user_name: { $first: "$user_name" },
  //           gender: { $first: "$gender" },
  //           country: { $first: "$country" },
  //           state: { $first: "$state" },
  //           city: { $first: "$city" },
  //           dob: { $first: "$dob" },
  //           contact_no: { $first: "$contact_no" },
  //           createdAt: { $first: "$createdAt" },
  //           updatedAt: { $first: "$updatedAt" },
  //           __v: { $first: "$__v" },
  //           users: { $push: "$users" },
  //           hotel_details: { $first: "$hotel_details" },
  //           room_details: { $first: "$room_details" },
  //           transaction_details: { $first: "$transaction_details" }
  //         }
  //       },
  //       {
  //         $project: {
  //           "_id": 1,
  //           "hotel_id": 1,
  //           "room_id": 1,
  //           "total_booked_rooms": 1,
  //           "user_id": 1,
  //           "check_in_date": 1,
  //           "check_out_date": 1,
  //           "date_time": 1,
  //           "total_adult": 1,
  //           "total_child": 1,
  //           "payment_type": 1,
  //           "status": 1,
  //           "room_title": 1,
  //           "price": 1,
  //           "user_name": 1,
  //           "gender": 1,
  //           "country": 1,
  //           "state": 1,
  //           "city": 1,
  //           "dob": 1,
  //           "contact_no": 1,
  //           "createdAt": 1,
  //           "updatedAt": 1,
  //           "__v": 1,
  //           'users._id': 1,
  //           'users.phone': 1,
  //           'users.customer_details.name': 1,
  //           'users.customer_details.email_address': 1,
  //           'users.customer_details.gender': 1,
  //           'users.customer_details.state': 1,
  //           'users.customer_details.city': 1,
  //           'users.customer_details.photo': 1,
  //           "hotel_details._id": 1,
  //           "hotel_details.hotel_name": 1,
  //           "hotel_details.hotel_address": 1,
  //           "room_details._id": 1,
  //           "room_details.room_title": 1,
  //           "room_details.photos": 1,
  //           "room_details.price": 1,
  //           // transaction_details: 1
  //           "transaction_details.trnsaction_id": 1
  //         }
  //       }
  //     ]);

  //     if (booked_data.length == 0) {
  //       throw new Forbidden("No Booked Hotel Found");
  //     }

  //     for (let j = 0; j < booked_data[0].room_details.length; j++) {
  //       for (let k = 0; k < booked_data[0].room_details[j].photos.length; k++) {
  //         booked_data[0].room_details[j].photos[k] = await image_url("room_syt", booked_data[0].room_details[j].photos[k]);
  //       }
  //     }

  //     return this.sendJSONResponse(
  //       res,
  //       "Hotel Booked Data!",
  //       {
  //         length: 1
  //       },
  //       booked_data
  //     );
  //   } catch (error) {
  //     if (error instanceof NotFound) {
  //       throw error;
  //     }
  //     return this.sendErrorResponse(req, res, error);
  //   }
  // }

  async admin_display_Details_booked_hotel(req, res) {
    try {
      const tokenData = req.userData;
      if (!tokenData) {
        return res.status(401).json({
          message: "Auth fail"
        });
      }

      const userData = await userSchema.findById(tokenData.id);
      if (userData.role !== "admin" && userData.role !== "agency" && userData.role !== "customer") {
        throw new Forbidden("You are not admin, agency, or customer");
      }

      let _id = req.params._id;
      // Validate _id format
      if (!mongoose.Types.ObjectId.isValid(_id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }

      const booked_data = await hotel_booking_syt_Schema.aggregate([
        {
          $match: {
            _id: new mongoose.Types.ObjectId(_id)
            // status: { $in: ["booked", "approved"] }
          }
        },
        {
          $lookup: {
            from: "hotel_syts",
            localField: "hotel_id",
            foreignField: "_id",
            as: "hotel_details"
          }
        },
        {
          $lookup: {
            from: "room_syts",
            localField: "room_id",
            foreignField: "_id",
            as: "room_details"
          }
        },
        {
          $lookup: {
            from: "users",
            localField: "user_id",
            foreignField: "_id",
            as: "users"
          }
        },
        {
          $unwind: "$users"
        },
        {
          $lookup: {
            from: "customers",
            localField: "users._id",
            foreignField: "user_id",
            as: "customer_details"
          }
        },
        {
          $unwind: {
            path: "$customer_details",
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $addFields: {
            "users.customer_details": "$customer_details"
          }
        },
        {
          $group: {
            _id: "$_id",
            hotel_id: { $first: "$hotel_id" },
            room_id: { $first: "$room_id" },
            total_booked_rooms: { $first: "$total_booked_rooms" },
            user_id: { $first: "$user_id" },
            check_in_date: { $first: "$check_in_date" },
            check_out_date: { $first: "$check_out_date" },
            transaction_id: { $first: "$transaction_id" },
            date_time: { $first: "$date_time" },
            total_adult: { $first: "$total_adult" },
            total_child: { $first: "$total_child" },
            payment_type: { $first: "$payment_type" },
            status: { $first: "$status" },
            room_title: { $first: "$room_title" },
            price: { $first: "$price" },
            user_name: { $first: "$user_name" },
            gender: { $first: "$gender" },
            country: { $first: "$country" },
            state: { $first: "$state" },
            city: { $first: "$city" },
            dob: { $first: "$dob" },
            travel_details: { $first: "$travel_details" },
            admin_margin_price_child: { $first: "$admin_margin_price_child" },
            admin_margin_price_adult: { $first: "$admin_margin_price_adult" },
            admin_margin_percentage: { $first: "$admin_margin_percentage" },
            price_per_person_adult: { $first: "$price_per_person_adult" },
            price_per_person_child: { $first: "$price_per_person_child" },
            contact_no: { $first: "$contact_no" },
            createdAt: { $first: "$createdAt" },
            updatedAt: { $first: "$updatedAt" },
            breakfast: { $first: "$breakfast" },
            lunch: { $first: "$lunch" },
            dinner: { $first: "$dinner" },
            breakfast_price: { $first: "$breakfast_price" },
            lunch_price: { $first: "$lunch_price" },
            dinner_price: { $first: "$dinner_price" },
            gst_price: { $first: "$gst_price" },
            __v: { $first: "$__v" },
            users: { $push: "$users" },
            hotel_details: { $first: "$hotel_details" },
            room_details: { $first: "$room_details" }
          }
        },
        {
          $project: {
            "_id": 1,
            "hotel_id": 1,
            "room_id": 1,
            "total_booked_rooms": 1,
            "user_id": 1,
            "check_in_date": 1,
            "check_out_date": 1,
            "date_time": 1,
            "total_adult": 1,
            "transaction_id": 1,
            "total_child": 1,
            "payment_type": 1,
            "status": 1,
            "room_title": 1,
            "price": 1,
            "user_name": 1,
            "gender": 1,
            "country": 1,
            "state": 1,
            "city": 1,
            "dob": 1,
            "admin_margin_price_child": 1,
            "admin_margin_price_adult": 1,
            "admin_margin_percentage": 1,
            "price_per_person_adult": 1,
            "travel_details": 1,
            "price_per_person_child": 1,
            "gst_price": 1,
            "breakfast": 1,
            "lunch": 1,
            "dinner": 1,
            "breakfast_price": 1,
            "lunch_price": 1,
            "dinner_price": 1,
            "contact_no": 1,
            "createdAt": 1,
            "updatedAt": 1,
            "__v": 1,
            "users._id": 1,
            "users.phone": 1,
            "users.customer_details.name": 1,
            "users.customer_details.email_address": 1,
            "users.customer_details.gender": 1,
            "users.customer_details.state": 1,
            "users.customer_details.city": 1,
            "users.customer_details.photo": 1,
            // "hotel_details._id": 1,
            // "hotel_details.hotel_name": 1,
            // "hotel_details.hotel_address": 1,
            "room_details": 1,
            "hotel_details": 1
            // "room_details._id": 1,
            // "room_details.room_title": 1,
            // "room_details.photos": 1,
            // "room_details.price": 1,
          }
        }
      ]);

      if (booked_data.length === 0) {
        throw new Forbidden("No Booked Hotel Found");
      }

      for (let j = 0; j < booked_data[0].room_details.length; j++) {
        for (let k = 0; k < booked_data[0].room_details[j].photos.length; k++) {
          booked_data[0].room_details[j].photos[k] = await image_url(
            "room_syt",
            booked_data[0].room_details[j].photos[k]
          );
        }
      }

      for (let j = 0; j < booked_data[0].hotel_details.length; j++) {
        for (let k = 0; k < booked_data[0].hotel_details[j].hotel_photo.length; k++) {
          booked_data[0].hotel_details[j].hotel_photo[k] = await image_url(
            "hotel_syt",
            booked_data[0].hotel_details[j].hotel_photo[k]
          );
        }
      }

      return this.sendJSONResponse(
        res,
        "Hotel Booked Data!",
        {
          length: 1
        },
        booked_data
      );
    } catch (error) {
      if (error instanceof NotFound) {
        throw error;
      }
      return this.sendErrorResponse(req, res, error);
    }
  }

  async hotel_status_change_api(req, res) {
    try {
      const tokenData = req.userData;
      if (tokenData === "") {
        return res.status(401).json({
          message: "Auth fail"
        });
      }
      const userData = await userSchema.find({ _id: tokenData.id });
      if (userData[0].role !== "admin" && userData[0].role !== "agency") {
        throw new Forbidden("you are not admin");
      }

      let hotel_booked_id = req.params.hotel_booked_id;

      if (!hotel_booked_id) {
        return res.status(404).json({
          success: false,
          message: "Hotel Booked Not Found!"
        });
      }

      let updateData = {
        status: req.body.status
      };

      let updatedData = await hotel_booking_syt_Schema.findByIdAndUpdate(hotel_booked_id, updateData, { new: true });

      io.emit("statusChange", {
        hotel_booked_id,
        status: req.body.status
      });

      res.status(200).json({
        success: true,
        message: "status update successfully",
        data: updatedData
      });
    } catch (error) {
      if (error instanceof NotFound) {
        throw error;
      }
      return this.sendErrorResponse(req, res, error);
    }
  }

  async hotel_status_cancel_by_user(req, res) {
    try {
      const tokenData = req.userData;
      if (tokenData === "") {
        return res.status(401).json({
          message: "Auth fail"
        });
      }
      const userData = await userSchema.find({ _id: tokenData.id });
      if (userData[0].role !== "customer") {
        return res.status(400).json({
          success: false,
          message: "you are not customer"
        });
      }

      let hotel_booked_id = req.params.hotel_booked_id;

      if (!hotel_booked_id) {
        return res.status(404).json({
          success: false,
          message: "Hotel Booked Not Found!"
        });
      }

      let updateData = {
        status: "cancel"
      };

      let updatedData = await hotel_booking_syt_Schema.findByIdAndUpdate(hotel_booked_id, updateData, { new: true });

      io.emit("statusCancel", {
        hotel_booked_id,
        status: "cancel"
      });

      res.status(200).json({
        success: true,
        message: "status cancel successfully",
        data: updatedData
      });
    } catch (error) {
      if (error instanceof NotFound) {
        throw error;
      }
      return this.sendErrorResponse(req, res, error);
    }
  }
};
