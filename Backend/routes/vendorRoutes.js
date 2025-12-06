const express = require("express");
const router = express.Router();
const {
    addVendor,
    getVendors
} = require("../controller/vendorController");

router.post("/add", addVendor);
router.get("/", getVendors);

module.exports = router;
