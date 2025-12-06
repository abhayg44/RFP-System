const express = require("express");
const router = express.Router();
const { sendRfpEmail } = require("../controller/emailController");

router.post("/send", sendRfpEmail);

module.exports = router;
