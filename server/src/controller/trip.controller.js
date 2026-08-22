const prisma = require("../lib/Prisma");
const { findOwnedTrip, isValidDate, toDate } = require("../utils/trip");

const tripSummaryInclude = {
  _count: { select: { stops: true, expenses: true, transports: true } },
  stops: {
    orderBy: { stopOrder: "asc" },
    select: { id: true, arrivalDate: true, departureDate: true, city: true },
  },
};

function validateTripInput(body, partial = false) {
  const { name, startDate, endDate } = body;
  if (!partial && (typeof name !== "string" || !name.trim())) return "Trip name is required.";
  if (name !== undefined && (typeof name !== "string" || !name.trim())) return "Trip name cannot be empty.";
  if (!partial && (!isValidDate(startDate) || !isValidDate(endDate))) return "Valid start and end dates are required.";
  if (startDate !== undefined && !isValidDate(startDate)) return "startDate must be a valid date.";
  if (endDate !== undefined && !isValidDate(endDate)) return "endDate must be a valid date.";
  if (isValidDate(startDate) && isValidDate(endDate) && toDate(endDate) < toDate(startDate)) return "endDate cannot be before startDate.";
  return null;
}

function tripData(body, partial = false) {
  const data = {};
  if (!partial || body.name !== undefined) data.name = body.name.trim();
  if (!partial || body.startDate !== undefined) data.startDate = toDate(body.startDate);
  if (!partial || body.endDate !== undefined) data.endDate = toDate(body.endDate);
  for (const key of ["description", "coverImage", "budget"]) if (!partial || body[key] !== undefined) data[key] = body[key] ?? null;
  if (!partial || body.isPublic !== undefined) data.isPublic = body.isPublic ?? false;
  return data;
}

async function createTrip(req, res, next) {
  try {
    const error = validateTripInput(req.body);
    if (error) return res.status(400).json({ message: error });
    const trip = await prisma.trip.create({
      data: { ...tripData(req.body), userId: req.auth.sub },
      include: tripSummaryInclude,
    });
    return res.status(201).json({ trip });
  } catch (error) { return next(error); }
}

async function listTrips(req, res, next) {
  try {
    const trips = await prisma.trip.findMany({
      where: { userId: req.auth.sub },
      orderBy: { startDate: "asc" },
      include: tripSummaryInclude,
    });
    return res.json({ trips });
  } catch (error) { return next(error); }
}

async function getTrip(req, res, next) {
  try {
    const trip = await findOwnedTrip(req.params.tripId, req.auth.sub, {
      include: {
        stops: {
          orderBy: { stopOrder: "asc" },
          include: { city: true, plannedActivities: { orderBy: { activityOrder: "asc" }, include: { activity: true } } },
        },
        transports: { orderBy: { departureTime: "asc" } },
        expenses: { orderBy: { expenseDate: "asc" } },
      },
    });
    if (!trip) return res.status(404).json({ message: "Trip not found." });
    return res.json({ trip });
  } catch (error) { return next(error); }
}

async function updateTrip(req, res, next) {
  try {
    const error = validateTripInput(req.body, true);
    if (error) return res.status(400).json({ message: error });
    const owned = await findOwnedTrip(req.params.tripId, req.auth.sub, { select: { id: true, startDate: true, endDate: true } });
    if (!owned) return res.status(404).json({ message: "Trip not found." });
    const start = req.body.startDate ? toDate(req.body.startDate) : owned.startDate;
    const end = req.body.endDate ? toDate(req.body.endDate) : owned.endDate;
    if (end < start) return res.status(400).json({ message: "endDate cannot be before startDate." });
    const trip = await prisma.trip.update({ where: { id: owned.id }, data: tripData(req.body, true), include: tripSummaryInclude });
    return res.json({ trip });
  } catch (error) { return next(error); }
}

async function deleteTrip(req, res, next) {
  try {
    const owned = await findOwnedTrip(req.params.tripId, req.auth.sub, { select: { id: true } });
    if (!owned) return res.status(404).json({ message: "Trip not found." });
    await prisma.trip.delete({ where: { id: owned.id } });
    return res.status(204).send();
  } catch (error) { return next(error); }
}

async function addStop(req, res, next) {
  try {
    const { cityId, arrivalDate, departureDate } = req.body;
    if (!cityId || !isValidDate(arrivalDate) || !isValidDate(departureDate)) return res.status(400).json({ message: "cityId, arrivalDate, and departureDate are required." });
    if (toDate(departureDate) < toDate(arrivalDate)) return res.status(400).json({ message: "departureDate cannot be before arrivalDate." });
    const trip = await findOwnedTrip(req.params.tripId, req.auth.sub, { select: { id: true, startDate: true, endDate: true, _count: { select: { stops: true } } } });
    if (!trip) return res.status(404).json({ message: "Trip not found." });
    if (toDate(arrivalDate) < trip.startDate || toDate(departureDate) > trip.endDate) return res.status(400).json({ message: "Stop dates must fall within the trip dates." });
    const city = await prisma.city.findUnique({ where: { id: cityId }, select: { id: true } });
    if (!city) return res.status(404).json({ message: "City not found." });
    const stop = await prisma.tripStop.create({ data: { tripId: trip.id, cityId, arrivalDate: toDate(arrivalDate), departureDate: toDate(departureDate), stopOrder: trip._count.stops }, include: { city: true } });
    return res.status(201).json({ stop });
  } catch (error) { return next(error); }
}

async function removeStop(req, res, next) {
  try {
    const stop = await prisma.tripStop.findFirst({ where: { id: req.params.stopId, tripId: req.params.tripId, trip: { userId: req.auth.sub } }, select: { id: true } });
    if (!stop) return res.status(404).json({ message: "Trip stop not found." });
    await prisma.tripStop.delete({ where: { id: stop.id } });
    return res.status(204).send();
  } catch (error) { return next(error); }
}

async function updateStop(req, res, next) {
  try {
    const { arrivalDate, departureDate, cityId } = req.body;
    if ((arrivalDate !== undefined && !isValidDate(arrivalDate)) || (departureDate !== undefined && !isValidDate(departureDate))) return res.status(400).json({ message: "Stop dates must be valid dates." });
    const stop = await prisma.tripStop.findFirst({ where: { id: req.params.stopId, tripId: req.params.tripId, trip: { userId: req.auth.sub } }, include: { trip: { select: { startDate: true, endDate: true } } } });
    if (!stop) return res.status(404).json({ message: "Trip stop not found." });
    const start = arrivalDate ? toDate(arrivalDate) : stop.arrivalDate;
    const end = departureDate ? toDate(departureDate) : stop.departureDate;
    if (end < start || start < stop.trip.startDate || end > stop.trip.endDate) return res.status(400).json({ message: "Stop dates must be ordered and fall within trip dates." });
    if (cityId) {
      const city = await prisma.city.findUnique({ where: { id: cityId }, select: { id: true } });
      if (!city) return res.status(404).json({ message: "City not found." });
    }
    const updatedStop = await prisma.tripStop.update({ where: { id: stop.id }, data: { ...(arrivalDate ? { arrivalDate: start } : {}), ...(departureDate ? { departureDate: end } : {}), ...(cityId ? { cityId } : {}) }, include: { city: true } });
    return res.json({ stop: updatedStop });
  } catch (error) { return next(error); }
}

async function reorderStops(req, res, next) {
  try {
    const { stopIds } = req.body;
    if (!Array.isArray(stopIds) || new Set(stopIds).size !== stopIds.length) return res.status(400).json({ message: "stopIds must be a unique array." });
    const trip = await findOwnedTrip(req.params.tripId, req.auth.sub, { select: { id: true } });
    if (!trip) return res.status(404).json({ message: "Trip not found." });
    const stops = await prisma.tripStop.findMany({ where: { tripId: trip.id }, select: { id: true } });
    if (stops.length !== stopIds.length || stops.some((stop) => !stopIds.includes(stop.id))) return res.status(400).json({ message: "stopIds must contain every stop in this trip exactly once." });
    await prisma.$transaction(async (tx) => {
      for (const [index, id] of stopIds.entries()) await tx.tripStop.update({ where: { id }, data: { stopOrder: -(index + 1) } });
      for (const [stopOrder, id] of stopIds.entries()) await tx.tripStop.update({ where: { id }, data: { stopOrder } });
    });
    const orderedStops = await prisma.tripStop.findMany({ where: { tripId: trip.id }, orderBy: { stopOrder: "asc" }, include: { city: true } });
    return res.json({ stops: orderedStops });
  } catch (error) { return next(error); }
}

module.exports = { createTrip, listTrips, getTrip, updateTrip, deleteTrip, addStop, updateStop, removeStop, reorderStops };
