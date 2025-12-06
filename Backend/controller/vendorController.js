const Vendor = require("../models/vendor");

exports.addVendor = async (req, res) => {
    const vendor = new Vendor(req.body);
    await vendor.save();
    res.json({ message: "Vendor added", vendor });
};

exports.getVendors = async (req, res) => {
    const vendors = await Vendor.find();
    res.json(vendors);
};
