const express = require("express");
const controller = require("../controller/share.controller");
const { requireAuth } = require("../middleware/auth.middleware");

const router = express.Router();
router.use(requireAuth);
router.post("/:tripId/share", controller.enableShare);
router.delete("/:tripId/share", controller.disableShare);

module.exports = router;
