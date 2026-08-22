const express = require("express");

const { register, login, getCurrentUser, requestPasswordReset, resetPassword } = require("../controller/auth.controller");
const { requireAuth } = require("../middleware/auth.middleware");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", requestPasswordReset);
router.post("/reset-password", resetPassword);
router.get("/me", requireAuth, getCurrentUser);

module.exports = router;
