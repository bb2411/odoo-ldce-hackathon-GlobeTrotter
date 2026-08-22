require("dotenv").config();

const express = require("express");
const cors = require("cors");

const prisma = require("./lib/Prisma");
const authRoutes = require("./routes/auth.routes");
const tripRoutes = require("./routes/trip.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const discoveryRoutes = require("./routes/discovery.routes");
const profileRoutes = require("./routes/profile.routes");
const shareRoutes = require("./routes/share.routes");
const publicRoutes = require("./routes/public.routes");
const { validateEnvironment } = require("./config/env");

validateEnvironment();

const app = express();

const allowedOrigins = process.env.CORS_ORIGIN?.split(",").map((origin) => origin.trim());
app.use(cors({ origin: allowedOrigins?.length ? allowedOrigins : true }));
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "GlobeTrotter API is running",
  });
});

app.get("/test-db", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    res.json({
      success: true,
      message: "Database connected successfully",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Database connection failed",
    });
  }
});

const PORT = process.env.PORT || 5000;

app.use("/api/auth", authRoutes);
app.use("/api/trips", tripRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api", discoveryRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/trips", shareRoutes);
app.use("/api/public", publicRoutes);

app.use((error, req, res, next) => {
  console.error(error);
  if (error.code === "P2002") return res.status(409).json({ message: "A record with these details already exists." });
  res.status(500).json({ message: "An unexpected server error occurred." });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
