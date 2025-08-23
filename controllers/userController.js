const { errorMonitor } = require("nodemailer/lib/xoauth2");
const Forbidden = require("../errors/Forbidden");
const NotFound = require("../errors/NotFound");
const BaseController = require("./BaseController");
const userschema = require("../models/usersSchema");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const agencySchema = require("../models/Agency_personalSchema");
const customerSchema = require("../models/customerSchema");
const Notificationschema = require("../models/NotificationSchema");
const { getReceiverSocketId, io } = require("../socket/socket");

module.exports = class usercontroller extends BaseController {
  // async loginAll(req, res) {
  //   try {
  //     const data = {
  //       phone: req.body.phone,
  //       password: req.body.password,
  //       role: req.body.role
  //     };
  //     console.log(data);

  //     let userData = await userschema.find(data);

  //     let userphone = await userschema.aggregate([{ $match: { phone: req.body.phone } }]);

  //     let userpassword = await userschema.aggregate([{ $match: { password: req.body.password } }]);

  //     console.log(userData);
  //     console.log(userphone);

  //     const isPasswordValid = await bcrypt.compare(data.password, userData.password);
  //     if (!isPasswordValid) {
  //       throw new Forbidden("Password is incorrect");
  //     }

  //     if (userphone.length === 0) {
  //       throw new Forbidden("mobile number is wrong");
  //     }
  //     if (userpassword.length === 0) {
  //       throw new Forbidden("password is wrong");
  //     }

  //     if (
  //       req.body.role != "admin" &&
  //       req.body.role != "agency" &&
  //       req.body.role != "customer" &&
  //       req.body.role != "member"
  //     ) {
  //       console.log(req.body.role, typeof req.body.role);
  //       throw new Error("Invalid role");
  //     }
  //     if (userData.length === 0) {
  //       throw new Forbidden("mobile number and password is wrong");
  //     }
  //     //   if (userData[0].status !== "active") {
  //     //     throw new Forbidden("you are blocked");
  //     //   }

  //     //   Update Notification Token if send from login
  //     //   if (req.body?.deviceToken && req.body?.deviceType) {
  //     //     try {
  //     //       const deviceToken = req.body.deviceToken;
  //     //       const deviceType = req.body.deviceType;

  //     //       if (!deviceType || !deviceToken) {
  //     //         throw new Error("Invalid deviceType or deviceToken");
  //     //       }
  //     //       if (deviceType !== "ios" && deviceType !== "android" && deviceType !== "web") {
  //     //         throw new Error("Invalid deviceType");
  //     //       }

  //     //   Check if user exists
  //     //   const userInfo = await userSchema.findById(userData[0]._id);
  //     //   if (!userInfo) {
  //     //     throw new Error("User Not Found");
  //     //   }

  //     // set notificationTokens as null for other matching tokens
  //     //   const removedUserNotificationTokens = await userSchema.updateMany(
  //     //     {
  //     //       "notificationTokens.deviceToken": deviceToken
  //     //       //   "notificationTokens.deviceType": deviceType,
  //     //     },
  //     //     { $unset: { notificationTokens: "" } },
  //     //     { new: true }
  //     //   );
  //     // console.log(removedUserNotificationTokens);

  //     // update notification token in userProfile
  //     //   const updatedUserProfile = await userSchema.findByIdAndUpdate(
  //     //     userData[0]._id,
  //     //     {
  //     //       // $set: {
  //     //   [`notificationTokens.${deviceType}`]: [
  //     //     {
  //     //       deviceType: deviceType,
  //     //       deviceToken: deviceToken,
  //     //       lastUpdatedOn: new Date(),
  //     //     },
  //     //   ],
  //     // },
  //     //       $set: {
  //     //         [`notificationTokens`]: {
  //     //           deviceType: deviceType,
  //     //           deviceToken: deviceToken,
  //     //           lastUpdatedOn: new Date()
  //     //         }
  //     //       }
  //     //     },
  //     //     {
  //     //       new: true
  //     //     }
  //     //   );
  //     //   console.log(updatedUserProfile);

  //     //       if (!updatedUserProfile) {
  //     //         throw new Error("Failed to Update Notification Tokens");
  //     //       }
  //     //     } catch (error) {
  //     //       console.log(error);
  //     //     }
  //     //   }

  //     const requireData = {
  //       id: userData[0]._id,
  //       role: userData[0].role,
  //       email_address: userData[0].email_address
  //     };

  //     const token = jwt.sign(requireData, "asd", { expiresIn: "365d" });
  //     const result = {
  //       token: token,
  //       userId: userData[0]._id
  //     };

  //     return this.sendJSONResponse(
  //       res,
  //       "successfully login",
  //       {
  //         length: 1
  //       },
  //       result
  //     );
  //   } catch (error) {
  //     if (error instanceof NotFound) {
  //       console.log(error); // throw error;;
  //     }
  //     return this.sendErrorResponse(req, res, error);
  //   }
  // }

  async loginAll(req, res) {
    try {
      const { phone, password, role } = req.body;

      console.log({ phone, password, role });

      // Check if the user exists with the given phone number and role
      let userData = await userschema.findOne({ phone, role });

      // Check if the user is found
      if (!userData) {
        throw new Forbidden("Mobile number is incorrect");
      }

      // Compare the provided password with the stored hashed password
      const isPasswordValid = await bcrypt.compare(password, userData.password);
      if (!isPasswordValid) {
        throw new Forbidden("Password is incorrect");
      }

      // Validate role
      const validRoles = ["admin", "agency", "customer", "member"];
      if (!validRoles.includes(role)) {
        throw new Error("Invalid role");
      }

      // Create JWT token
      const requireData = {
        id: userData._id,
        role: userData.role,
        email_address: userData.email_address
      };

      const token = jwt.sign(requireData, "asd", { expiresIn: "365d" });
      const result = {
        token: token,
        userId: userData._id
      };

      let notificationMessage = "";

      if (role === "agency") {
        let agency = await agencySchema.findOne({ user_id: userData._id });
        notificationMessage =
          agency && agency.full_name
            ? `Welcome back, ${agency.full_name}! Your agency dashboard awaits.`
            : `Welcome back! Your agency dashboard awaits.`;
      } else if (role === "customer") {
        let user = await customerSchema.findOne({ user_id: userData._id });
        notificationMessage =
          user && user.name
            ? `Hello ${user.name}, great to see you again! Start exploring now.`
            : `Hello, great to see you again! Start exploring now.`;
      } else if (role === "admin") {
        notificationMessage = `Welcome to Start Your Tour!`;
      }
      // Create a notification
      let notificationData = await Notificationschema.create({
        user_id: userData._id,
        title: "Login Successful",
        text: notificationMessage,
        user_type: role
      });

      const adminSocketId = getReceiverSocketId(userData._id);
      console.log("AdminSocketId:", adminSocketId);
      if (adminSocketId) {
        io.to(adminSocketId).emit("newNotification", notificationData);
      } else {
        console.log("Socket not connected for user:", userData._id);
      }
      return this.sendJSONResponse(res, "Successfully logged in", { length: 1 }, result);
    } catch (error) {
      if (error instanceof NotFound) {
        console.log(error);
      }
      return this.sendErrorResponse(req, res, error);
    }
  }
};
