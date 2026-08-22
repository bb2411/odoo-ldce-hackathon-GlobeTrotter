const express = require("express");
const controller = require("../controller/share.controller");
const { requireAuth } = require("../middleware/auth.middleware");

const router = express.Router();
router.get("/trips/:shareToken", controller.getPublicTrip);
router.post("/trips/:shareToken/copy", requireAuth, controller.copyPublicTrip);

module.exports = router;
