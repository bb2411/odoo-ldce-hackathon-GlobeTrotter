const express = require("express");
const { listCities, listActivities, getDiscoveryMeta } = require("../controller/discovery.controller");
const { requireAuth } = require("../middleware/auth.middleware");

const router = express.Router();
router.get("/cities", requireAuth, listCities);
router.get("/activities", requireAuth, listActivities);
router.get("/discovery/meta", requireAuth, getDiscoveryMeta);

module.exports = router;
