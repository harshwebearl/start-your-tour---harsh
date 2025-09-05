const mongoose = require("mongoose");

function getISTTime() {
  const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC +5:30
  const now = new Date();
  const istTime = new Date(now.getTime() + istOffset);
  return istTime;
}

const user_schema = new mongoose.Schema(
  {
    phone: {
      type: Number,
      require: true
    },
    password: {
      type: String,
      require: true
    },
    role: {
      type: String,
      require: true
    },
    subrole_id: {
      type: mongoose.Schema.Types.ObjectId
    },
    // pin:{
    //   type:Number
    // },
    status: {
      type: String
    }
  },
  {
    timestamps: {
      currentTime: () => getISTTime() // Use custom function for timestamps
    }
  }
);

const userschema = new mongoose.model("users", user_schema);

module.exports = userschema;
