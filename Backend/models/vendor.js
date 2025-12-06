const mongoose = require("mongoose");

const VendorSchema = new mongoose.Schema({
    name: String,
    email: String,
    phone: String,
    category: String
});

module.exports = mongoose.model("Vendor", VendorSchema);
