const jwt = require("jsonwebtoken");

function requireAuth(req, res, next) {
  const authorization = req.headers.authorization;

  if (!authorization?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authentication token is required." });
  }

  try {
    req.auth = jwt.verify(authorization.slice(7), process.env.JWT_SECRET);
    return next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired authentication token." });
  }
}

module.exports = { requireAuth };
