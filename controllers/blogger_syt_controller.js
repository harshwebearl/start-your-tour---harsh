const BaseController = require("../controllers/BaseController");
const blogger_content_syt_schema = require("../models/blogger_content_syt_schema");
const blogger_syt_schema = require("../models/blogger_syt_schema");
const userSchema = require("../models/usersSchema");
const NotFound = require("../errors/NotFound");
const image_url = require("../update_url_path");
const Forbidden = require("../errors/Forbidden");
const BadRequest = require("../errors/BadRequest");
const fn = "blogger";
const mongoose = require("mongoose");

module.exports = class Blogger extends BaseController {
  async add_blogger(req, res) {
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

      const requiredFields = ["mobile_number", "state", "city", "country"];
      for (const field of requiredFields) {
        if (!req.body[field]) {
          return res.status(400).json({
            message: `${field} is required`
          });
        }
      }

      const blogger_data = {
        blog_owner_name: req.body.blog_owner_name,
        blog_owner_photo: req.file.filename,
        mobile_number: req.body.mobile_number,
        emai_id: req.body.emai_id,
        city: req.body.city,
        state: req.body.state,
        country: req.body.country
      };

      const blogger_syt = new blogger_syt_schema(blogger_data);
      const blogger = await blogger_syt.save();

      if (blogger.length == 0) {
        throw new Forbidden("blogger not add! Please try again");
      }

      return this.sendJSONResponse(
        res,
        "Blogger Added!",
        {
          length: 1
        },
        blogger
      );
    } catch (error) {
      if (error instanceof NotFound) {
        throw error;
      }
      return this.sendErrorResponse(req, res, error);
    }
  }

  async add_blog_content(req, res) {
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

      const blog_data = {
        blog_title: req.body.blog_title,
        blog_title_photo: req.file.filename,
        blog_title_points: req.body.blog_title_points,
        blog_category: req.body.blog_category,
        blog_content: req.body.blog_content,
        blogger_syt_id: req.body.blogger_syt_id
      };

      const blog_syt = new blogger_content_syt_schema(blog_data);
      const blog = await blog_syt.save();

      if (blog.length == 0) {
        throw new Forbidden("blog content not add! Please try again");
      }

      return this.sendJSONResponse(
        res,
        "Blog Content Added!",
        {
          length: 1
        },
        blog
      );
    } catch (error) {
      if (error instanceof NotFound) {
        throw error;
      }
      return this.sendErrorResponse(req, res, error);
    }
  }

  // Get list of all bloggers (Public access - no token required)
  async list_blogger_public(req, res) {
    try {
      const { page = 1, limit = 10, search = '' } = req.query;
      const skip = (page - 1) * limit;
      
      const query = {};
      if (search) {
        query['$or'] = [
          { 'blogger_syt.blog_owner_name': { $regex: search, $options: 'i' } },
          { blog_title: { $regex: search, $options: 'i' } },
          { blog_category: { $regex: search, $options: 'i' } }
        ];
      }

      const blog_content = await blogger_content_syt_schema.aggregate([
        {
          $lookup: {
            from: "blogger_syts",
            localField: "blogger_syt_id",
            foreignField: "_id",
            as: "blogger_syt"
          }
        },
        { $unwind: "$blogger_syt" },
        { $match: query },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: parseInt(limit) }
      ]);

      const total = await blogger_content_syt_schema.countDocuments();

      // Process images
      for (let i = 0; i < blog_content.length; i++) {
        blog_content[i].blog_title_photo = await image_url(fn, blog_content[i].blog_title_photo);
        if (blog_content[i].blogger_syt) {
          blog_content[i].blogger_syt.blog_owner_photo = await image_url(
            fn,
            blog_content[i].blogger_syt.blog_owner_photo
          );
        }
      }

      return this.sendJSONResponse(
        res,
        "List of Bloggers",
        {
          total,
          page: parseInt(page),
          totalPages: Math.ceil(total / limit),
          length: blog_content.length
        },
        blog_content
      );
    } catch (error) {
      return this.sendErrorResponse(req, res, error);
    }
  }

  // Get list of all bloggers (Admin access)
  async list_blogger(req, res) {
    try {
      const tokenData = req.userData;
      if (!tokenData) {
        throw new Forbidden("Authentication required");
      }

      const userData = await userSchema.findById(tokenData.id);
      if (!userData || userData.role !== "admin") {
        throw new Forbidden("Admin access required");
      }

      const blog_content = await blogger_content_syt_schema.aggregate([
        {
          $lookup: {
            from: "blogger_syts",
            localField: "blogger_syt_id",
            foreignField: "_id",
            as: "blogger_syt"
          }
        }
      ]);

      for (let i = 0; i < blog_content.length; i++) {
        blog_content[i].blog_title_photo = await image_url(fn, blog_content[i].blog_title_photo);
        if (blog_content[i].blogger_syt && blog_content[i].blogger_syt.length > 0) {
          blog_content[i].blogger_syt[0].blog_owner_photo = await image_url(
            fn,
            blog_content[i].blogger_syt[0].blog_owner_photo
          );
        }
      }

      return this.sendJSONResponse(
        res,
        "List of Blog!",
        {
          length: blog_content.length
        },
        blog_content
      );
    } catch (error) {
      if (error instanceof NotFound) {
        throw error;
      }
      return this.sendErrorResponse(req, res, error);
    }
  }

  // Get blogger details by ID (Public access - no token required)
  async get_blogger_detail_public(req, res) {
    try {
      const { id } = req.params;
      
      if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        throw new BadRequest("Invalid blog ID");
      }

      const blog_content = await blogger_content_syt_schema.aggregate([
        {
          $match: { _id: mongoose.Types.ObjectId(id) }
        },
        {
          $lookup: {
            from: "blogger_syts",
            localField: "blogger_syt_id",
            foreignField: "_id",
            as: "blogger_syt"
          }
        },
        { $unwind: "$blogger_syt" }
      ]);

      if (!blog_content || blog_content.length === 0) {
        throw new NotFound("Blog not found");
      }

      // Process images
      blog_content[0].blog_title_photo = await image_url(fn, blog_content[0].blog_title_photo);
      if (blog_content[0].blogger_syt) {
        blog_content[0].blogger_syt.blog_owner_photo = await image_url(
          fn,
          blog_content[0].blogger_syt.blog_owner_photo
        );
      }

      // Get related blogs from the same blogger
      const related_blogs = await blogger_content_syt_schema.find({
        blogger_syt_id: blog_content[0].blogger_syt_id,
        _id: { $ne: blog_content[0]._id }
      }).limit(3);

      // Process related blogs images
      for (let blog of related_blogs) {
        blog.blog_title_photo = await image_url(fn, blog.blog_title_photo);
      }

      return this.sendJSONResponse(
        res,
        "Blog details retrieved successfully",
        {
          blog: blog_content[0],
          related_blogs
        }
      );
    } catch (error) {
      if (error instanceof NotFound) {
        throw error;
      }
      return this.sendErrorResponse(req, res, error);
    }
  }

  // Get blogger details by ID (Admin access)
  async detail_blogger(req, res) {
    try {
      const tokenData = req.userData;
      if (!tokenData) {
        throw new Forbidden("Authentication required");
      }

      const userData = await userSchema.findById(tokenData.id);
      if (!userData || userData.role !== "admin") {
        throw new Forbidden("Admin access required");
      }

      const blogger_content_id = req.query._id;
      if (!blogger_content_id || !mongoose.Types.ObjectId.isValid(blogger_content_id)) {
        throw new BadRequest("Invalid blog ID");
      }

      const blog_content = await blogger_content_syt_schema.aggregate([
        {
          $match: { _id: mongoose.Types.ObjectId(blogger_content_id) }
        },
        {
          $lookup: {
            from: "blogger_syts",
            localField: "blogger_syt_id",
            foreignField: "_id",
            as: "blogger_syt"
          }
        },
        { $unwind: "$blogger_syt" }
      ]);

      if (!blog_content || blog_content.length === 0) {
        throw new NotFound("Blog not found");
      }

      blog_content[0].blog_title_photo = await image_url(fn, blog_content[0].blog_title_photo);
      if (blog_content[0].blogger_syt) {
        blog_content[0].blogger_syt.blog_owner_photo = await image_url(
          fn,
          blog_content[0].blogger_syt.blog_owner_photo
        );
      }

      return this.sendJSONResponse(
        res,
        "Blog details retrieved successfully",
        {
          length: 1
        },
        blog_content[0]
      );
    } catch (error) {
      if (error instanceof NotFound) {
        throw error;
      }
      return this.sendErrorResponse(req, res, error);
    }
  }

  async get_list_blogger(req, res) {
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

      const blogger_list = await blogger_syt_schema.find({});

      for (let i = 0; i < blogger_list.length; i++) {
        blogger_list[i].blog_owner_photo = await image_url(fn, blogger_list[i].blog_owner_photo);
      }

      return this.sendJSONResponse(
        res,
        "List of Blogger!",
        {
          length: 1
        },
        blogger_list
      );
    } catch (error) {
      if (error instanceof NotFound) {
        throw error;
      }
      return this.sendErrorResponse(req, res, error);
    }
  }

  async get_blogger_by_id(req, res) {
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

      const blogger_id = req.query._id;

      const result = await blogger_syt_schema.findById(blogger_id);

      result.blog_owner_photo = await image_url(fn, result.blog_owner_photo);

      return this.sendJSONResponse(
        res,
        "Details of Blogger!",
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

  async get_blog_content_list(req, res) {
    try {
      const tokenData = req.userData;
      if (tokenData === "") {
        return res.status(401).json({
          message: "Auth fail"
        });
      }
      const userData = await userSchema.find({ _id: tokenData.id });

      if (userData[0].role !== "customer") {
        throw new Forbidden("you are not  customer");
      }

      const result = await blogger_content_syt_schema.aggregate([
        {
          $lookup: {
            from: "blogger_syts",
            localField: "blogger_syt_id",
            foreignField: "_id",
            as: "blogger_details"
          }
        },
        {
          $addFields: {
            blogger_id: { $first: "$blogger_details._id" },
            blogger_name: { $first: "$blogger_details.blog_owner_name" },
            blogger_photo: { $first: "$blogger_details.blog_owner_photo" }
          }
        },
        {
          $project: {
            _id: 1,
            blog_title: 1,
            blog_title_photo: 1,
            blog_content: 1,
            createdAt: 1,
            blogger_id: 1,
            blogger_name: 1,
            blogger_photo: 1
          }
        }
      ]);

      for (let i = 0; i < result.length; i++) {
        result[i].blog_title_photo = await image_url(fn, result[i].blog_title_photo);
        result[i].blogger_photo = await image_url(fn, result[i].blogger_photo);
      }

      // result[0].blog_title_photo = await image_url(fn, result[0].blog_title_photo);

      // result[0].blogger_syt_details[0].blog_owner_photo = await image_url(
      //   fn,
      //   result[0].blogger_syt_details[0].blog_owner_photo
      // );

      return this.sendJSONResponse(
        res,
        "Details of Blog Content!",
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

  async get_blog_content_by_id(req, res) {
    try {
      const tokenData = req.userData;
      if (!tokenData) {
        return res.status(401).json({
          message: "Authentication failed"
        });
      }
      const userData = await userSchema.findById(tokenData.id);
      if (!userData || userData.role !== "admin") {
        throw new Forbidden("You are not an admin");
      }

      const blog_content_id = req.query._id;
      if (!blog_content_id || !mongoose.Types.ObjectId.isValid(blog_content_id)) {
        throw new BadRequest("Invalid blog content ID");
      }

      const result = await blogger_content_syt_schema.aggregate([
        {
          $match: {
            _id: new mongoose.Types.ObjectId(blog_content_id)
          }
        },
        {
          $lookup: {
            from: "blogger_syts", // Verify this matches your MongoDB collection name
            localField: "blogger_syt_id",
            foreignField: "_id",
            as: "blogger_syt_details"
          }
        },
        {
          $unwind: { path: "$blogger_syt_details", preserveNullAndEmptyArrays: true }
        }
      ]);

      if (!result || result.length === 0) {
        throw new NotFound("Blog content not found");
      }

      // Process images
      result[0].blog_title_photo = await image_url(fn, result[0].blog_title_photo || "");
      if (result[0].blogger_syt_details) {
        result[0].blogger_syt_details.blog_owner_photo = await image_url(
          fn,
          result[0].blogger_syt_details.blog_owner_photo || ""
        );
      }

      return this.sendJSONResponse(
        res,
        "Details of Blog Content",
        { length: 1 },
        result[0]
      );
    } catch (error) {
      return this.sendErrorResponse(req, res, error);
    }
  }

  async get_blog_content_by_id(req, res) {
    try {
      const blog_content_id = req.query._id;

      const tokenData = req.userData;
      if (tokenData === "") {
        return res.status(401).json({
          message: "Auth fail"
        });
      }
      const userData = await userSchema.find({ _id: tokenData.id });
      console.log(userData[0].role);

      if (userData[0].role !== "admin") {
        throw new Forbidden("you are not admin ");
      }

      const result = await blogger_content_syt_schema.aggregate([
        {
          $match: {
            _id: mongoose.Types.ObjectId(blog_content_id)
          }
        },
        {
          $lookup: {
            from: "blogger_syts",
            localField: "blogger_syt_id",
            foreignField: "_id",
            as: "blogger_syt_details"
          }
        }
      ]);

      if (!result || result.length === 0) {
        throw new NotFound('Blog content not found');
      }

      const blogContent = result[0];

      if (blogContent.blog_title_photo) {
        blogContent.blog_title_photo = await image_url(fn, blogContent.blog_title_photo);
      }

      if (blogContent.blogger_syt_details &&
        blogContent.blogger_syt_details.length > 0 &&
        blogContent.blogger_syt_details[0].blog_owner_photo) {
        blogContent.blogger_syt_details[0].blog_owner_photo = await image_url(
          fn,
          blogContent.blogger_syt_details[0].blog_owner_photo
        );
      }

      return this.sendJSONResponse(
        res,
        "Details of Blog Content!",
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

  async get_blog_content_by_blogger_id(req, res) {
    try {
      console.log('get_blog_content_by_blogger_id called with query:', req.query);

      const tokenData = req.userData;
      if (!tokenData) {
        console.log('No token data found');
        return res.status(401).json({
          message: "Authentication required"
        });
      }

      const userData = await userSchema.findById(tokenData.id).lean();
      if (!userData) {
        console.log('User not found:', tokenData.id);
        return res.status(404).json({ message: "User not found" });
      }

      if (userData.role !== "admin") {
        console.log('Access denied for user:', userData._id, 'Role:', userData.role);
        throw new Forbidden("You are not authorized to access this resource");
      }

      const blogger_id = req.query._id || req.query.blogger_id;
      if (!blogger_id) {
        console.log('Missing blogger ID in query');
        return res.status(400).json({ message: "Blogger ID is required" });
      }

      console.log('Searching for blog content with blogger_id:', blogger_id);

      // First verify the blogger exists
      const bloggerExists = await blogger_syt_schema.exists({ _id: blogger_id });
      if (!bloggerExists) {
        console.log('Blogger not found:', blogger_id);
        throw new NotFound(`Blogger with ID ${blogger_id} not found`);
      }

      const blog_content = await blogger_content_syt_schema.aggregate([
        {
          $match: {
            blogger_syt_id: new mongoose.Types.ObjectId(blogger_id)
          }
        },
        {
          $lookup: {
            from: 'blogger_syts',
            localField: 'blogger_syt_id',
            foreignField: '_id',
            as: 'blogger_details'
          }
        },
        {
          $unwind: '$blogger_details'
        }
      ]);

      console.log('Found blog content count:', blog_content.length);

      // Process blog images
      for (const content of blog_content) {
        try {
          if (content.blog_title_photo) {
            content.blog_title_photo = await image_url(fn, content.blog_title_photo);
          }
        } catch (error) {
          console.error('Error processing image for blog:', content._id, error);
          content.blog_title_photo = null;
        }
      }

      return this.sendJSONResponse(
        res,
        "List of Blog Content!",
        {
          length: 1
        },
        blog_content
      );
    } catch (error) {
      if (error instanceof NotFound) {
        throw error;
      }
      return this.sendErrorResponse(req, res, error);
    }
  }

  async update_blogger(req, res) {
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

      const blogger_id = req.query._id;

      const blogger_data = {
        blog_owner_name: req.body.blog_owner_name,
        blog_owner_photo: req.file.filename,
        mobile_number: req.body.mobile_number,
        emai_id: req.body.emai_id,
        city: req.body.city,
        state: req.body.state,
        country: req.body.country
      };

      const blogger = await blogger_syt_schema.findByIdAndUpdate(blogger_id, blogger_data, { new: true });

      if (blogger.length == 0) {
        throw new Forbidden("Data Not updated ! please try again");
      }

      if (blogger.length == 0) {
        throw new Forbidden("blogger not add! Please try again");
      }

      return this.sendJSONResponse(
        res,
        "Blogger Data Updated!",
        {
          length: 1
        },
        blogger
      );
    } catch (error) {
      if (error instanceof NotFound) {
        throw error;
      }
      return this.sendErrorResponse(req, res, error);
    }
  }

  async update_blog_content(req, res) {
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

      const blog_content_id = req.query._id;

      const existing_blog_content = await blogger_content_syt_schema.findById(blog_content_id);
      if (!existing_blog_content) {
        return res.status(404).json({
          message: "Blog content not found"
        });
      }

      const blog_content_data = {
        blog_title: req.body.blog_title,
        blog_title_photo: req.file ? req.file.filename : existing_blog_content.blog_title_photo,
        blog_title_points: req.body.blog_title_points,
        blog_category: req.body.blog_category,
        blog_content: req.body.blog_content,
        blogger_syt_id: req.body.blogger_syt_id
      };

      const blog_content = await blogger_content_syt_schema.findByIdAndUpdate(blog_content_id, blog_content_data, {
        new: true
      });

      if (blog_content.length == 0) {
        throw new Forbidden("blog content not updated! Please try again");
      }

      return this.sendJSONResponse(
        res,
        "Blog Content Updated Succesfully!",
        {
          length: 1
        },
        blog_content
      );
    } catch (error) {
      if (error instanceof NotFound) {
        throw error;
      }
      return this.sendErrorResponse(req, res, error);
    }
  }

  async delete_blogger(req, res) {
    try {
      const tokenData = req.userData;
      const blogger_id = req.query._id;

      if (tokenData === "") {
        return res.status(401).json({
          message: "Auth fail"
        });
      }
      const userData = await userSchema.find({ _id: tokenData.id });

      if (userData[0].role !== "admin") {
        throw new Forbidden("you are not admin");
      }

      const result = await blogger_syt_schema.findByIdAndDelete(blogger_id);

      return this.sendJSONResponse(
        res,
        "Blogger Deleted!",
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

  async delete_blog_content(req, res) {
    try {
      const tokenData = req.userData;
      const bloge_content_id = req.query._id;

      if (tokenData === "") {
        return res.status(401).json({
          message: "Auth fail"
        });
      }
      const userData = await userSchema.find({ _id: tokenData.id });

      if (userData[0].role !== "admin") {
        throw new Forbidden("you are not admin");
      }

      const result = await blogger_content_syt_schema.findByIdAndDelete(bloge_content_id);

      return this.sendJSONResponse(
        res,
        "Blog Content Deleted!",
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
};
