var mongoose = require("mongoose");
// const aggregatePaginate = require("mongoose-aggregate-paginate-v2");

// Global Plugins
// mongoose.plugin(aggregatePaginate);

mongoose.set("strictQuery", true);

// Connect to DB
mongoose.connect(process.env.DATABASE_URL, (err) => {
  if (err) {
    console.log(`DB : Error`);
  }
  console.log(`DB : Connected`);
});

module.exports = mongoose;
