const express = require("express");
const controller = require("../controller/profile.controller");
const { requireAuth } = require("../middleware/auth.middleware");

const router = express.Router();
router.use(requireAuth);
router.get("/", controller.getProfile);
router.patch("/", controller.updateProfile);
router.patch("/password", controller.changePassword);
router.delete("/", controller.deleteAccount);

module.exports = router;
