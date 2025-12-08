const express = require("express");
const router = express.Router();
const {
    getVendorProposals,
    createVendorRequest,
    triggerEvaluation,
    getEvaluationResults
} = require("../controller/vendorController");

router.post("/request", createVendorRequest);
router.get("/proposals/:rfpId", getVendorProposals);
router.post("/evaluate/:rfpId", triggerEvaluation);
router.get("/evaluation/:rfpId", getEvaluationResults);

module.exports = router;
