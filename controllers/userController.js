// const { errorMonitor } = require("nodemailer/lib/xoauth2");
// const Forbidden = require("../errors/Forbidden");
// const NotFound = require("../errors/NotFound");
// const BaseController = require("./BaseController");
// const userschema = require("../models/usersSchema");
// const jwt = require("jsonwebtoken");
// const bcrypt = require("bcrypt");
// const agencySchema = require("../models/Agency_personalSchema");
// const customerSchema = require("../models/customerSchema");
// const Notificationschema = require("../models/NotificationSchema");
// const { getReceiverSocketId, io } = require("../socket/socket");

// module.exports = class usercontroller extends BaseController {
//   // async loginAll(req, res) {
//   //   try {
//   //     const data = {
//   //       phone: req.body.phone,
//   //       password: req.body.password,
//   //       role: req.body.role
//   //     };
//   //     console.log(data);

//   //     let userData = await userschema.find(data);

//   //     let userphone = await userschema.aggregate([{ $match: { phone: req.body.phone } }]);

//   //     let userpassword = await userschema.aggregate([{ $match: { password: req.body.password } }]);

//   //     console.log(userData);
//   //     console.log(userphone);

//   //     const isPasswordValid = await bcrypt.compare(data.password, userData.password);
//   //     if (!isPasswordValid) {
//   //       throw new Forbidden("Password is incorrect");
//   //     }

//   //     if (userphone.length === 0) {
//   //       throw new Forbidden("mobile number is wrong");
//   //     }
//   //     if (userpassword.length === 0) {
//   //       throw new Forbidden("password is wrong");
//   //     }

//   //     if (
//   //       req.body.role != "admin" &&
//   //       req.body.role != "agency" &&
//   //       req.body.role != "customer" &&
//   //       req.body.role != "member"
//   //     ) {
//   //       console.log(req.body.role, typeof req.body.role);
//   //       throw new Error("Invalid role");
//   //     }
//   //     if (userData.length === 0) {
//   //       throw new Forbidden("mobile number and password is wrong");
//   //     }
//   //     //   if (userData[0].status !== "active") {
//   //     //     throw new Forbidden("you are blocked");
//   //     //   }

//   //     //   Update Notification Token if send from login
//   //     //   if (req.body?.deviceToken && req.body?.deviceType) {
//   //     //     try {
//   //     //       const deviceToken = req.body.deviceToken;
//   //     //       const deviceType = req.body.deviceType;

//   //     //       if (!deviceType || !deviceToken) {
//   //     //         throw new Error("Invalid deviceType or deviceToken");
//   //     //       }
//   //     //       if (deviceType !== "ios" && deviceType !== "android" && deviceType !== "web") {
//   //     //         throw new Error("Invalid deviceType");
//   //     //       }

//   //     //   Check if user exists
//   //     //   const userInfo = await userSchema.findById(userData[0]._id);
//   //     //   if (!userInfo) {
//   //     //     throw new Error("User Not Found");
//   //     //   }

//   //     // set notificationTokens as null for other matching tokens
//   //     //   const removedUserNotificationTokens = await userSchema.updateMany(
//   //     //     {
//   //     //       "notificationTokens.deviceToken": deviceToken
//   //     //       //   "notificationTokens.deviceType": deviceType,
//   //     //     },
//   //     //     { $unset: { notificationTokens: "" } },
//   //     //     { new: true }
//   //     //   );
//   //     // console.log(removedUserNotificationTokens);

//   //     // update notification token in userProfile
//   //     //   const updatedUserProfile = await userSchema.findByIdAndUpdate(
//   //     //     userData[0]._id,
//   //     //     {
//   //     //       // $set: {
//   //     //   [`notificationTokens.${deviceType}`]: [
//   //     //     {
//   //     //       deviceType: deviceType,
//   //     //       deviceToken: deviceToken,
//   //     //       lastUpdatedOn: new Date(),
//   //     //     },
//   //     //   ],
//   //     // },
//   //     //       $set: {
//   //     //         [`notificationTokens`]: {
//   //     //           deviceType: deviceType,
//   //     //           deviceToken: deviceToken,
//   //     //           lastUpdatedOn: new Date()
//   //     //         }
//   //     //       }
//   //     //     },
//   //     //     {
//   //     //       new: true
//   //     //     }
//   //     //   );
//   //     //   console.log(updatedUserProfile);

//   //     //       if (!updatedUserProfile) {
//   //     //         throw new Error("Failed to Update Notification Tokens");
//   //     //       }
//   //     //     } catch (error) {
//   //     //       console.log(error);
//   //     //     }
//   //     //   }

//   //     const requireData = {
//   //       id: userData[0]._id,
//   //       role: userData[0].role,
//   //       email_address: userData[0].email_address
//   //     };

//   //     const token = jwt.sign(requireData, "asd", { expiresIn: "365d" });
//   //     const result = {
//   //       token: token,
//   //       userId: userData[0]._id
//   //     };

//   //     return this.sendJSONResponse(
//   //       res,
//   //       "successfully login",
//   //       {
//   //         length: 1
//   //       },
//   //       result
//   //     );
//   //   } catch (error) {
//   //     if (error instanceof NotFound) {
//   //       console.log(error); // throw error;;
//   //     }
//   //     return this.sendErrorResponse(req, res, error);
//   //   }
//   // }

//   async loginAll(req, res) {
//     try {
//       const { phone, password, role } = req.body;

//       console.log({ phone, password, role });

//       // Check if the user exists with the given phone number and role
//       let userData = await userschema.findOne({ phone, role });

//       // Check if the user is found
//       if (!userData) {
//         throw new Forbidden("Mobile number is incorrect");
//       }

//       // Compare the provided password with the stored hashed password
//       const isPasswordValid = await bcrypt.compare(password, userData.password);
//       if (!isPasswordValid) {
//         throw new Forbidden("Password is incorrect");
//       }

//       // Validate role
//       const validRoles = ["admin", "agency", "customer", "member"];
//       if (!validRoles.includes(role)) {
//         throw new Error("Invalid role");
//       }

//       // Create JWT token
//       const requireData = {
//         id: userData._id,
//         role: userData.role,
//         email_address: userData.email_address
//       };

//       const token = jwt.sign(requireData, "asd", { expiresIn: "365d" });
//       const result = {
//         token: token,
//         userId: userData._id
//       };

//       let notificationMessage = "";

//       if (role === "agency") {
//         let agency = await agencySchema.findOne({ user_id: userData._id });
//         notificationMessage =
//           agency && agency.full_name
//             ? `Welcome back, ${agency.full_name}! Your agency dashboard awaits.`
//             : `Welcome back! Your agency dashboard awaits.`;
//       } else if (role === "customer") {
//         let user = await customerSchema.findOne({ user_id: userData._id });
//         notificationMessage =
//           user && user.name
//             ? `Hello ${user.name}, great to see you again! Start exploring now.`
//             : `Hello, great to see you again! Start exploring now.`;
//       } else if (role === "admin") {
//         notificationMessage = `Welcome to Start Your Tour!`;
//       }
//       // Create a notification
//       let notificationData = await Notificationschema.create({
//         user_id: userData._id,
//         title: "Login Successful",
//         text: notificationMessage,
//         user_type: role
//       });

//       const adminSocketId = getReceiverSocketId(userData._id);
//       console.log("AdminSocketId:", adminSocketId);
//       if (adminSocketId) {
//         io.to(adminSocketId).emit("newNotification", notificationData);
//       } else {
//         console.log("Socket not connected for user:", userData._id);
//       }
//       return this.sendJSONResponse(res, "Successfully logged in", { length: 1 }, result);
//     } catch (error) {
//       if (error instanceof NotFound) {
//         console.log(error);
//       }
//       return this.sendErrorResponse(req, res, error);
//     }
//   }
// };
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

module.exports = class UserController extends BaseController {
  async loginAll(req, res) {
    try {
      const { phone, password, role, deviceToken, deviceType } = req.body;

      if (!phone || !password || !role) {
        throw new Forbidden("Phone, password, and role are required");
      }

      const validRoles = ["admin", "agency", "customer", "member"];
      if (!validRoles.includes(role)) {
        throw new Forbidden("Invalid role");
      }

      const userData = await userschema.findOne({ phone, role });
      if (!userData) {
        throw new Forbidden("Invalid phone number or role");
      }

      const isPasswordValid = await bcrypt.compare(password, userData.password);
      if (!isPasswordValid) {
        throw new Forbidden("Incorrect password");
      }

      if (deviceToken && deviceType) {
        if (!["ios", "android", "web"].includes(deviceType)) {
          throw new Forbidden("Invalid device type");
        }

        await userschema.updateMany(
          { "notificationTokens.deviceToken": deviceToken },
          { $unset: { notificationTokens: "" } }
        );

        await userschema.findByIdAndUpdate(userData._id, {
          $set: {
            notificationTokens: {
              deviceType,
              deviceToken,
              lastUpdatedOn: new Date(),
            },
          },
        });
      }

      const payload = {
        id: userData._id,
        role: userData.role,
        email_address: userData.email_address,
      };
      const token = jwt.sign(payload, process.env.JWT_SECRET || "asd", {
        expiresIn: "365d",
      });

      let notificationMessage = "";
      if (role === "agency") {
        const agency = await agencySchema.findOne({ user_id: userData._id });
        notificationMessage = agency?.full_name
          ? `Welcome back, ${agency.full_name}! Your agency dashboard awaits.`
          : `Welcome back! Your agency dashboard awaits.`;
      } else if (role === "customer") {
        const user = await customerSchema.findOne({ user_id: userData._id });
        notificationMessage = user?.name
          ? `Hello ${user.name}, great to see you again! Start exploring now.`
          : `Hello, great to see you again! Start exploring now.`;
      } else if (role === "admin") {
        notificationMessage = `Welcome to Start Your Tour!`;
      }

      const notificationData = await Notificationschema.create({
        user_id: userData._id,
        title: "Login Successful",
        text: notificationMessage,
        user_type: role,
      });

      const receiverSocketId = getReceiverSocketId(userData._id);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("newNotification", notificationData);
      } else {
        console.log(`Socket not connected for user: ${userData._id}`);
      }

      return this.sendJSONResponse(res, "Successfully logged in", { length: 1 }, {
        token,
        userId: userData._id,
      });
    } catch (error) {
      console.error("Login error:", error);
      return this.sendErrorResponse(req, res, error);
    }
  }

  // View user details
  async viewDetail(req, res) {
    try {
      const userId = req.user?.id; // Assuming JWT middleware sets req.user
      if (!userId) {
        throw new Forbidden("Unauthorized: User ID not found");
      }

      const userData = await userschema.findById(userId).select("-password"); // Exclude password
      if (!userData) {
        throw new NotFound("User not found");
      }

      let additionalData = {};
      if (userData.role === "agency") {
        const agency = await agencySchema.findOne({ user_id: userId });
        if (agency) {
          additionalData = {
            full_name: agency.full_name,
            agency_details: agency, // Add more fields as needed
          };
        }
      } else if (userData.role === "customer") {
        const customer = await customerSchema.findOne({ user_id: userId });
        if (customer) {
          additionalData = {
            name: customer.name,
            customer_details: customer, // Add more fields as needed
          };
        }
      }

      const result = {
        userId: userData._id,
        phone: userData.phone,
        email_address: userData.email_address,
        role: userData.role,
        ...additionalData,
      };

      return this.sendJSONResponse(res, "User details retrieved successfully", { length: 1 }, result);
    } catch (error) {
      console.error("View detail error:", error);
      return this.sendErrorResponse(req, res, error);
    }
  }

  // Edit user details
  async editDetail(req, res) {
    try {
      const userId = req.user?.id; // Assuming JWT middleware sets req.user
      if (!userId) {
        throw new Forbidden("Unauthorized: User ID not found");
      }

      const { phone, email_address, full_name, name } = req.body;

      // Validate input
      if (!phone && !email_address && !full_name && !name) {
        throw new Forbidden("At least one field is required to update");
      }

      // Find user
      const userData = await userschema.findById(userId);
      if (!userData) {
        throw new NotFound("User not found");
      }

      // Update user schema fields
      const updateData = {};
      if (phone) updateData.phone = phone;
      if (email_address) updateData.email_address = email_address;

      if (Object.keys(updateData).length > 0) {
        await userschema.findByIdAndUpdate(userId, { $set: updateData }, { new: true });
      }

      // Update role-specific details
      if (userData.role === "agency" && full_name) {
        await agencySchema.findOneAndUpdate(
          { user_id: userId },
          { $set: { full_name } },
          { new: true, upsert: true } // Create if not exists
        );
      } else if (userData.role === "customer" && name) {
        await customerSchema.findOneAndUpdate(
          { user_id: userId },
          { $set: { name } },
          { new: true, upsert: true } // Create if not exists
        );
      }

      // Create notification
      const notificationMessage = `Your profile has been updated successfully.`;
      const notificationData = await Notificationschema.create({
        user_id: userId,
        title: "Profile Updated",
        text: notificationMessage,
        user_type: userData.role,
      });

      // Emit socket notification
      const receiverSocketId = getReceiverSocketId(userId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("newNotification", notificationData);
      } else {
        console.log(`Socket not connected for user: ${userId}`);
      }

      return this.sendJSONResponse(res, "User details updated successfully", { length: 1 }, { userId });
    } catch (error) {
      console.error("Edit detail error:", error);
      return this.sendErrorResponse(req, res, error);
    }
  }
};