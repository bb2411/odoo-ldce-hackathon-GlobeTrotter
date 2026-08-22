const express = require("express");
const { getDashboard } = require("../controller/dashboard.controller");
const { requireAuth } = require("../middleware/auth.middleware");

const router = express.Router();
router.get("/", requireAuth, getDashboard);

module.exports = router;
