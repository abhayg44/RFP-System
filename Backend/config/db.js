const mongoose = require("mongoose");

require("dotenv").config();

const connectDB = async () => {
  try {
    console.log("url is ",process.env.MONGO_URL);
    await mongoose.connect(process.env.MONGO_URL);

    console.log("MongoDB Connected Successfully");
  } catch (err) {
    console.error("MongoDB Connection Error:", err.message);
    process.exit(1); 
  }
};

module.exports = connectDB;
