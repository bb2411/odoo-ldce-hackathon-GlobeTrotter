const prisma = require("../lib/Prisma");

async function getDashboard(req, res, next) {
  try {
    const now = new Date();
    const [upcomingTrips, recentTrips, cities] = await Promise.all([
      prisma.trip.findMany({
        where: { userId: req.auth.sub, endDate: { gte: now } },
        orderBy: { startDate: "asc" },
        take: 5,
        include: { _count: { select: { stops: true } } },
      }),
      prisma.trip.findMany({
        where: { userId: req.auth.sub },
        orderBy: { updatedAt: "desc" },
        take: 5,
        include: { _count: { select: { stops: true } } },
      }),
      prisma.city.findMany({ where: { countryCode: "IN" }, orderBy: { name: "asc" }, take: 8 }),
    ]);
    const budget = await prisma.trip.aggregate({
      where: { userId: req.auth.sub, endDate: { gte: now } },
      _sum: { budget: true },
    });
    return res.json({
      upcomingTrips,
      recentTrips,
      recommendedCities: cities,
      budgetHighlights: { plannedBudget: budget._sum.budget || 0 },
    });
  } catch (error) { return next(error); }
}

module.exports = { getDashboard };
