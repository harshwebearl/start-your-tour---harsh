const Forbidden = require("../errors/Forbidden");
const NotFound = require("../errors/NotFound");
const BaseController = require("./BaseController");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const axios = require("axios");
const userSchema = require("../models/usersSchema");
const customerSchema = require("../models/customerSchema");
const CustomRequirementSchema = require("../models/custom_requirementsSchema");
const Notificationschema = require("../models/NotificationSchema.js");
const Otp = require("../models/otp.js");
const image_url = require("../update_url_path.js");
const { getReceiverSocketId, io } = require("../socket/socket.js");
const fn = "users";

module.exports = class UserController extends BaseController {
  // Register a new user
  async register(req, res) {
    try {
      const hash = await bcrypt.hash(req.body.password, 10);
      const usersData = {
        phone: req.body.phone,
        password: hash,
        email_address: req.body.email_address,
        role: "customer"
      };
      const schemaData = await userSchema.find({
        phone: usersData.phone,
        role: usersData.role
      });
      if (schemaData.length !== 0) {
        return res.status(409).json({ message: "Data is Already Registered" });
      }
      let existingCustomer = await customerSchema.findOne({ email_address: req.body.email_address });
      if (existingCustomer) {
        return res.status(409).json({ message: "Email is already registered" });
      }
      const InsertUsersData = new userSchema(usersData);
      const users_data = await InsertUsersData.save();
      const data = {
        user_id: users_data.id,
        name: req.body.name,
        email_address: req.body.email_address,
        referal_code: req.body.referal_code,
        gender: req.body.gender,
        state: req.body.state,
        city: req.body.city
      };
      const userData = new customerSchema(data);
      const user = await userData.save();
      let notificationData = await Notificationschema.create({
        user_id: user.user_id,
        title: "User Registration Successful",
        text: `Hello ${user.name}, thank you for registering with Start Your Tour! We're thrilled to have you on board. Explore exciting destinations and make your journey unforgettable.`,
        user_type: "customer"
      });
      const customeradminSocketId = getReceiverSocketId(users_data.id);
      if (customeradminSocketId) {
        io.to(customeradminSocketId).emit("newNotification", notificationData);
      }
      return this.sendJSONResponse(res, "user registered", { length: 1 }, user);
    } catch (error) {
      return this.sendErrorResponse(req, res, error);
    }
  }

  async register(req, res) {
    try {
      const hash = await bcrypt.hash(req.body.password, 10);
      const usersData = {
        phone: req.body.phone,
        password: hash,
        email_address: req.body.email_address,
        role: "customer"
      };

      const schemaData = await userSchema.find({
        phone: usersData.phone,
        // email_address: usersData.email_address,
        role: usersData.role
      });

      if (schemaData.length !== 0) {
        throw new Forbidden("Data is Already Registered");
      }

      const InsertUsersData = new userSchema(usersData);
      const users_data = await InsertUsersData.save();

      let existingCustomer = await customerSchema.findOne({ email_address: req.body.email_address });

      if (existingCustomer) {
        throw new Forbidden("Email is already registered");
      }

      const data = {
        user_id: users_data.id,
        name: req.body.name,
        email_address: req.body.email_address,
        referal_code: req.body.referal_code,
        gender: req.body.gender,
        state: req.body.state,
        city: req.body.city
      };

      const userData = new customerSchema(data);
      const user = await userData.save();

      let notificationData = await Notificationschema.create({
        user_id: user.user_id,
        title: "User Registration Successful",
        text: `Hello ${user.name}, thank you for registering with Start Your Tour! We're thrilled to have you on board. Explore exciting destinations and make your journey unforgettable.`,
        user_type: "customer"
      });

      const customeradminSocketId = getReceiverSocketId(users_data.id);
      if (customeradminSocketId) {
        io.to(customeradminSocketId).emit("newNotification", notificationData);
      }

      return this.sendJSONResponse(
        res,
        "user registered",
        {
          length: 1
        },
        user
      );
    } catch (error) {
      if (error instanceof NotFound) {
        console.log(error);
      }
      return this.sendErrorResponse(req, res, error);
    }
  }

  async display_all_user_detail_by_admin(req, res) {
    try {
      // const tokenData = req.userData;
      // const adminData = await adminSchema.find({ _id: tokenData.id });
      // if (adminData.length === 0) {
      //   throw new Forbidden("you are not admin");
      // }
      const id = req.query._id;
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

      const display_all_user_detail_by_admin = await userSchema.aggregate([
        {
          $match: { $and: [{ _id: mongoose.Types.ObjectId(id) }, { role: "customer" }] }
        },
        {
          $lookup: {
            from: "customers",
            localField: "_id",
            foreignField: "user_id",
            as: "customer_details",
            pipeline: [
              {
                $project: {
                  password: 0
                }
              }
            ]
          }
        },
        {
          $lookup: {
            from: "custom_requirements",
            localField: "_id",
            foreignField: "user_id",
            as: "custom_requirement",
            pipeline: [
              {
                $lookup: {
                  from: "destination_categories",
                  localField: "category",
                  foreignField: "_id",
                  as: "destination_categories"
                }
              },
              {
                $lookup: {
                  from: "book_packages",
                  localField: "_id",
                  foreignField: "custom_package_id",
                  as: "book_packages"
                }
              },
              {
                $lookup: {
                  from: "bids",
                  localField: "_id",
                  foreignField: "custom_requirement_id",
                  as: "bids_details"
                }
              }
              // {
              //     $match:{"book_packages" : {$ne:[]}}
              // }
            ]
          }
        },
        {
          $project: {
            password: 0
          }
        }

        //    {
        //     $match:{"custom_requirement" : {$ne:[]}}
        // }
      ]);

      // display_all_user_detail_by_admin[0].customer_details[0].photo = "rakesh" + display_all_user_detail_by_admin[0].customer_details[0].photo

      for (let i = 0; i < display_all_user_detail_by_admin.length; i++) {
        const user = display_all_user_detail_by_admin[i];
        for (let j = 0; j < user.customer_details.length; j++) {
          const detail = user.customer_details[j];
          detail.photo = await image_url(fn, detail.photo);
        }
      }

      return this.sendJSONResponse(
        res,
        "display all user details ",
        {
          length: 1
        },
        display_all_user_detail_by_admin
      );
    } catch (error) {
      if (error instanceof NotFound) {
        console.log(error); // throw error;
      }
      return this.sendErrorResponse(req, res, error);
    }
  }

  async display_all_user_list_by_admin(req, res) {
    try {
      // const tokenData = req.userData;
      // const adminData = await adminSchema.find({ _id: tokenData.id });
      // if (adminData.length === 0) {
      //   throw new Forbidden("you are not admin");
      // }
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

      const display_all_user_list_by_admin = await userSchema.aggregate([
        {
          $match: { role: "customer" }
        },
        {
          $lookup: {
            from: "customers",
            localField: "_id",
            foreignField: "user_id",
            as: "customer_details",
            pipeline: [
              {
                $project: {
                  password: 0
                }
              }
            ]
          }
        },
        {
          $project: {
            password: 0
          }
        }
        // {
        //   $lookup: {
        //     from: "custom_requirements",
        //     localField: "_id",
        //     foreignField: "user_id",
        //     as: "custom_requirement",
        //     pipeline: [
        //       {
        //         $lookup: {
        //           from: "book_packages",
        //           localField: "_id",
        //           foreignField: "custom_package_id",
        //           as: "book_packages"
        //         }
        //       }
        //       // {
        //       //     $match:{"book_packages" : {$ne:[]}}
        //       // }
        //     ]
        //   }
        // }
        //    {
        //     $match:{"custom_requirement" : {$ne:[]}}
        // }
      ]);

      for (let i = 0; i < display_all_user_list_by_admin.length; i++) {
        const user = display_all_user_list_by_admin[i];
        for (let j = 0; j < user.customer_details.length; j++) {
          const detail = user.customer_details[j];
          detail.photo = await image_url(fn, detail.photo);
        }
      }

      return this.sendJSONResponse(
        res,
        "display all user list ",
        {
          length: 1
        },
        display_all_user_list_by_admin
      );
    } catch (error) {
      if (error instanceof NotFound) {
        console.log(error); // throw error;
      }
      return this.sendErrorResponse(req, res, error);
    }
  }

  async getUsers(req, res) {
    try {
      // const tokenData = req.userData;
      // const adminData = await adminSchema.find({ _id: tokenData.id });
      // if (adminData.length === 0) {
      //   throw new Forbidden("you are not admin");
      // }
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

      const userdata = await userSchema.find();
      if (userdata.length === 0) {
        throw new NotFound("user is not found");
      }
      // userData[0].photo = req.get('host') + '/images/users/' + userData[0].photo;
      return this.sendJSONResponse(
        res,
        "retrive user data",
        {
          length: 1
        },
        userData
      );
    } catch (error) {
      if (error instanceof NotFound) {
        console.log(error); // throw error;
      }
      return this.sendErrorResponse(req, res, error);
    }
  }

  async updatePassword(req, res) {
    try {
      const tokenData = req.userData;
      console.log(tokenData);
      const data = {
        user_id: tokenData.id,
        old_password: req.body.old_password,
        new_password: req.body.new_password
      };
      const userData = await userSchema.find({ _id: data.user_id });
      // if (userData[0].password !== data.old_password) {
      //   throw new Forbidden("old password is wrong");
      // }

      let customerInfo = await customerSchema.findOne({ user_id: data.user_id });

      const isPasswordValid = await bcrypt.compare(data.old_password, userData[0].password);
      if (!isPasswordValid) {
        throw new Forbidden("Old password is wrong");
      }
      const hashedNewPassword = await bcrypt.hash(data.new_password, 10);

      const updatedData = await userSchema.findByIdAndUpdate({ _id: data.user_id }, { password: hashedNewPassword });
      const user = await userSchema.find({ _id: data.user_id });

      let notificationForUser = await Notificationschema.create({
        user_id: tokenData.id,
        title: "Password Successfully Changed",
        text: `Your password has been successfully updated.`,
        user_type: "customer"
      });

      const customeradminSocketId = getReceiverSocketId(tokenData.id);
      console.log("change password:::", customeradminSocketId);
      if (customeradminSocketId) {
        io.to(customeradminSocketId).emit("newNotification", notificationForUser);
      }

      return this.sendJSONResponse(
        res,
        "password changed",
        {
          length: 1
        },
        updatedData
      );
    } catch (error) {
      if (error instanceof NotFound) {
        console.log(error); // throw error;
      }
      return this.sendErrorResponse(req, res, error);
    }
  }

  async deleteUser(req, res) {
    try {
      // const tokenData = req.userData;
      // console.log(tokenData);
      // const adminData = await adminSchema.find({ _id: tokenData.id });
      // if (adminData.length === 0) {
      //   throw new Forbidden("you are not admin");
      // }
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

      const deletedUser = await userSchema.findByIdAndUpdate(
        { _id: req.params.id },
        { status: 0, status_change_by: tokenData.id }
      );
      return this.sendJSONResponse(
        res,
        "user deleted",
        {
          length: 1
        },
        deletedUser
      );
    } catch (error) {
      if (error instanceof NotFound) {
        console.log(error); // throw error;
      }
      return this.sendErrorResponse(req, res, error);
    }
  }

  async userInfo(req, res) {
    try {
      const tokenData = req.userData;
      if (!tokenData || !tokenData.id) {
        return res.status(401).json({ message: "Auth fail: token missing or invalid" });
      }
      const userData = await userSchema.find({ _id: tokenData.id });
      if (!userData || userData.length === 0) {
        return res.status(404).json({ message: "User not found" });
      }
      if (userData[0].role !== "customer") {
        throw new Forbidden("you are not a customer");
      }
      const userinfo = await userSchema.aggregate([
        { $match: { _id: mongoose.Types.ObjectId(tokenData.id) } },
        {
          $lookup: {
            from: "customers",
            localField: "_id",
            foreignField: "user_id",
            as: "user_details"
          }
        },
        {
          $addFields: {
            user_details: {
              $map: {
                input: "$user_details",
                as: "userDetail",
                in: {
                  $mergeObjects: ["$$userDetail", { photo: { $concat: ["$$userDetail.photo"] } }]
                }
              }
            }
          }
        },
        { $project: { password: 0 } }
      ]);
      for (let i = 0; i < userinfo.length; i++) {
        const user = userinfo[i];
        for (let j = 0; j < user.user_details.length; j++) {
          const detail = user.user_details[j];
          detail.photo = await image_url(fn, detail.photo);
        }
      }
      return this.sendJSONResponse(res, "user retrieved", { length: 1 }, userinfo);
    } catch (error) {
      if (error instanceof NotFound) {
        console.log(error);
      }
      return this.sendErrorResponse(req, res, error);
    }
  }

  // async userInfo(req, res) {
  //   try {
  //     const tokenData = req.userData;
  //     if (!req.userData) {
  //       throw new Error("No Auth");
  //     }
  //     if (req.userData.type !== "admin" && req.userData.type !== "agency") {
  //       throw new Error("You dont have permission");
  //     }

  //     let userId;
  //     if (req.userData.type === "admin") {
  //       userId = req.query.userId;
  //     } else {
  //       userId = tokenData.id;
  //     }

  //     let isUserExist = await userSchema.findById(userId);
  //     if (!isUserExist) {
  //       throw new Error("User Does not exist");
  //     }

  //     const userData = await userSchema.find({ _id: userId });
  //     if (userData.length === 0) {
  //       throw new Forbidden("user is not found");
  //     }
  //     // userData[0].photo = req.get('host') + '/images/users/' + userData[0].photo;

  //     return this.sendJSONResponse(
  //       res,
  //       "user retrived",
  //       {
  //         length: 1
  //       },
  //       userData
  //     );
  //   } catch (error) {
  //     if (error instanceof NotFound) {
  //       console.log(error); // throw error;
  //     }
  //     return this.sendErrorResponse(req, res, error);
  //   }
  // }

  async usershistory(req, res) {
    try {
      const tokenData = req.userData;
      if (!req.userData) {
        throw new Error("No Auth");
      }
      if (req.userData.type !== "admin" && req.userData.type !== "user") {
        throw new Error("You dont have permission");
      }

      let userId;
      if (req.userData.type === "admin") {
        userId = req.query.userId;
      } else {
        userId = tokenData.id;
      }

      let isUserExist = await userSchema.findById(userId);
      if (!isUserExist) {
        throw new Error("User Does not exist");
      }

      const userHistory = await CustomRequirementSchema.aggregate([
        { $match: { user_id: mongoose.Types.ObjectId(userId) } },
        {
          $sort: { createdAt: -1 }
        },
        {
          $lookup: {
            from: "book_packages",
            localField: "_id",
            foreignField: "custom_package_id",
            as: "book_packages"
          }
        }
        //    {
        //     $match:{"book_packages" : {$ne:[]}}
        // }
      ]);

      return this.sendJSONResponse(res, "", {}, userHistory);
    } catch (error) {
      if (error instanceof NotFound) {
        console.log(error); // throw error;
      }
      return this.sendErrorResponse(req, res, error);
    }
  }

  // async updateProfile(req, res) {
  //   try {
  //     const tokenData = req.userData;
  //     // const objValidator = new niv.Validator(req.body, {
  //     //   name: "required",
  //     //   contect: "required",
  //     //   state: "required",
  //     //   city: "required",
  //     //   email_address: "required"
  //     // });

  //     // const matched = await objValidator.check();

  //     // if(!matched){
  //     //     throw new Forbidden('Validation Error');
  //     // }
  //     const data = {
  //       name: req.body.name,
  //       // mobile_number: req.body.contect,
  //       state: req.body.state,
  //       city: req.body.city,
  //       photo: generateFilePathForDB(req.file),
  //       email_address: req.body.email_address
  //     };
  //     // console.log({ user_id: tokenData.id })
  //     const userData = await customerSchema.updateOne({ user_id: tokenData.id }, data, { new: true });
  //     console.log(userData);
  //     if (userData.length === 0) {
  //       throw new Forbidden("user is not found");
  //     }

  //     return this.sendJSONResponse(
  //       res,
  //       "user profile updated",
  //       {
  //         length: 1
  //       },
  //       userData
  //     );
  //   } catch (error) {
  //     console.log(error);
  //     if (error instanceof NotFound) {
  //       console.log(error); // throw error;
  //     }
  //     return this.sendErrorResponse(req, res, error.message);
  //   }
  // }

  async updateProfile(req, res, image_url) {
    try {
      const tokenData = req.userData;
      if (!tokenData || !tokenData.id) {
        return res.status(401).json({ message: "Auth fail: token missing or invalid" });
      }
      let { name, address, state, city, email_address } = req.body;
      const data = { name, address, state, city, email_address };
      if (req.file) {
        data.photo = req.file.filename;
      }
      const userData = await customerSchema.findOneAndUpdate({ user_id: tokenData.id }, data, { new: true });
      if (!userData) {
        return res.status(404).json({ message: "user is not found" });
      }
      return this.sendJSONResponse(res, "user profile updated", { length: 1 }, userData);
    } catch (error) {
      console.log(error);
      if (error instanceof NotFound) {
        console.log(error);
      }
      return this.sendErrorResponse(req, res, error.message);
    }
  }

  async checkmobile_number(req, res) {
    try {
      const checkmobile_number = await userSchema.findOne({ mobile_number: req.body.mobile_number });
      if (!checkmobile_number) {
        console.log("123");
        throw new Forbidden("mobilenumber is not matched");
      }
      console.log(checkmobile_number);
      return this.sendJSONResponse(
        res,
        "user retrived",
        {
          length: 1
        },
        "mobile number is matched"
      );
    } catch (error) {
      if (error instanceof NotFound) {
        console.log(error); // throw error;
      }
      return this.sendErrorResponse(req, res, error);
    }
  }

  async forgotPassword(req, res) {
    try {
      const data = {
        phone: req.body.phone
      };
      const findnumber = await userSchema.findOne(data);
      // const userData = await userSchema.findById({_id: tokenData.id});
      console.log(findnumber);
      // if(findnumber.mobile_number !== 0){
      //     console.log("123");
      const hashedNewPassword = await bcrypt.hash(req.body.newpassword, 10);

      const updatedData = await userSchema.findOneAndUpdate({ _id: findnumber._id }, { password: hashedNewPassword });
      // console.log(updatedData);
      // }

      //

      // const updatedUser = await userSchema.findById({_id: tokenData.id});

      return this.sendJSONResponse(
        res,
        "data retrived",
        {
          length: 1
        },
        "Password Changed Successfully"
      );
    } catch (error) {
      if (error instanceof NotFound) {
        console.log(error); // throw error;
      }
      return this.sendErrorResponse(req, res, error);
    }
  }

  async send_otp(req, res) {
    const { contact, status } = req.body;

    // Validate the contact number
    if (!contact || contact.length !== 10 || isNaN(contact)) {
      return res.status(400).json({ message: "Invalid phone number" });
    }

    const number = `+91${contact}`;
    const randomOtp = Math.floor(Math.random() * 900000) + 100000; // Generate a 6-digit OTP
    const smsUrl = `https://rslri.connectbind.com:8443/bulksms/bulksms?username=DG35-webearl&password=digimile&type=0&dlr=1&destination=${number}&source=WEBEAR&message=Dear User, Your one time password is ${randomOtp} and it is valid for 10 minutes. Do not share it to anyone. Thank you, Team WEBEARL TECHNOLOGIES.&entityid=1101602010000073269&tempid=1107169899584811565`;

    try {
      // Check if the contact number is already registered
      const existingUser = await userSchema.findOne({ phone: contact, role: "customer" });

      if (status === "register" && existingUser) {
        return res.status(400).json({ message: "Phone number is already registered" });
      }

      if (status === "forgot" && !existingUser) {
        return res.status(400).json({ message: "Phone number is not registered" });
      }

      const response = await axios.get(smsUrl);

      if (response.status === 200) {
        // Save the OTP in the database
        await Otp.findOneAndUpdate(
          { contact: contact }, // Find document by contact
          { $set: { otp: randomOtp } }, // Update the OTP value
          { upsert: true, new: true } // If not found, insert new document, and return the new document
        );

        return res.status(200).json({ contact: contact, message: "OTP sent and saved successfully", otp: randomOtp });
      } else {
        return res.status(500).json({ message: "Failed to send OTP" });
      }
    } catch (error) {
      console.error("Error sending OTP:", error);
      return res.status(500).json({ message: "Error sending OTP", error });
    }
  }

  async verify_otp(req, res) {
    try {
      let { otp, contact } = req.body;
      let otpData = await Otp.findOne({ contact });
      if (!otpData) {
        return res.status(400).json({ succuss: false, message: "User not found!" });
      }

      if (otp !== otpData.otp) {
        return res.status(400).json({ succuss: false, message: "invalid otp" });
      } else {
        await Otp.findOneAndUpdate({ contact: contact }, { $set: { otp: null } });
        return res.status(200).json({ succuss: true, message: "otp verify succussfully" });
      }
    } catch (error) {
      return res.status(500).json({ succuss: false, message: error.message });
    }
  }
};
