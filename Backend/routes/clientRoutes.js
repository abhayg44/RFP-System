const express = require("express");
const router = express.Router();
const { createRfp, getAllRfps, createClientRequest } = require("../controller/clientController");

router.post("/create", createRfp);
router.get("/", getAllRfps);
router.post("/request",createClientRequest);

module.exports = router;
