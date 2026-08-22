const prisma = require("../lib/Prisma");

async function listCities(req, res, next) {
  try {
    const { search, country } = req.query;
    const where = {
      ...(country ? { country: { equals: country, mode: "insensitive" } } : {}),
      ...(search ? { OR: [{ name: { contains: search, mode: "insensitive" } }, { country: { contains: search, mode: "insensitive" } }] } : {}),
    };
    const cities = await prisma.city.findMany({ where, orderBy: { name: "asc" }, take: 30 });
    return res.json({ cities });
  } catch (error) { return next(error); }
}

async function listActivities(req, res, next) {
  try {
    const { cityId, search, category, minPrice, maxPrice, maxDuration } = req.query;
    const where = {
      ...(cityId ? { cityId } : {}),
      ...(category ? { category: { equals: category, mode: "insensitive" } } : {}),
      ...(minPrice || maxPrice ? { basePrice: { ...(minPrice ? { gte: Number(minPrice) } : {}), ...(maxPrice ? { lte: Number(maxPrice) } : {}) } } : {}),
      ...(maxDuration ? { durationMinutes: { lte: Number(maxDuration) } } : {}),
      ...(search ? { OR: [{ name: { contains: search, mode: "insensitive" } }, { description: { contains: search, mode: "insensitive" } }] } : {}),
    };
    const activities = await prisma.activity.findMany({ where, orderBy: [{ rating: "desc" }, { name: "asc" }], take: 50, include: { city: true } });
    return res.json({ activities });
  } catch (error) { return next(error); }
}

async function getDiscoveryMeta(req, res, next) {
  try {
    const [countries, categories] = await Promise.all([
      prisma.city.findMany({ distinct: ["country"], select: { country: true }, orderBy: { country: "asc" } }),
      prisma.activity.findMany({ distinct: ["category"], where: { category: { not: null } }, select: { category: true }, orderBy: { category: "asc" } }),
    ]);
    return res.json({ countries: countries.map(item => item.country), categories: categories.map(item => item.category).filter(Boolean) });
  } catch (error) { return next(error); }
}

module.exports = { listCities, listActivities, getDiscoveryMeta };
