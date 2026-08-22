const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const prisma = require("../lib/Prisma");

const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  profileImage: true,
  createdAt: true,
  updatedAt: true,
};

function createToken(userId) {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

function validateRegistration({ name, email, password }) {
  if (typeof name !== "string" || name.trim().length < 2) {
    return "Name must be at least 2 characters long.";
  }

  if (typeof email !== "string" || !/^\S+@\S+\.\S+$/.test(email)) {
    return "A valid email address is required.";
  }

  if (typeof password !== "string" || password.length < 8) {
    return "Password must be at least 8 characters long.";
  }

  return null;
}

async function register(req, res, next) {
  try {
    const { name, email, password, profileImage } = req.body;
    const validationError = validateRegistration({ name, email, password });

    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });

    if (existingUser) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
        profileImage: typeof profileImage === "string" ? profileImage.trim() || null : null,
      },
      select: publicUserSelect,
    });

    return res.status(201).json({
      message: "Registration successful.",
      token: createToken(user.id),
      user,
    });
  } catch (error) {
    return next(error);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (typeof email !== "string" || typeof password !== "string") {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });
    const validPassword = user && (await bcrypt.compare(password, user.passwordHash));

    if (!validPassword) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const { passwordHash, ...publicUser } = user;
    return res.json({
      message: "Login successful.",
      token: createToken(user.id),
      user: publicUser,
    });
  } catch (error) {
    return next(error);
  }
}

async function getCurrentUser(req, res, next) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.auth.sub },
      select: publicUserSelect,
    });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    return res.json({ user });
  } catch (error) {
    return next(error);
  }
}

module.exports = { register, login, getCurrentUser };
