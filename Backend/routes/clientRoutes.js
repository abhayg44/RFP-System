const express = require("express");
const router = express.Router();
const { createRfp, getAllRfps, createClientRequest, editRequest, deleteRequest, getParticularRequest } = require("../controller/clientController");

router.post("/create", createRfp);
router.get("/", getAllRfps);
router.post("/request",createClientRequest);
router.put("/:id",editRequest);
router.delete("/:id",deleteRequest);
router.get("/:id",getParticularRequest);

module.exports = router;
