const crypto = require("crypto");
const prisma = require("../lib/Prisma");
const { findOwnedTrip } = require("../utils/trip");

const publicTripInclude = { stops: { orderBy: { stopOrder: "asc" }, include: { city: true, plannedActivities: { orderBy: [{ scheduledDate: "asc" }, { activityOrder: "asc" }], include: { activity: true } } } }, transports: { orderBy: { departureTime: "asc" } }, expenses: { orderBy: { expenseDate: "asc" } } };

async function enableShare(req, res, next) {
  try {
    const trip = await findOwnedTrip(req.params.tripId, req.auth.sub, { select: { id: true, shareToken: true } });
    if (!trip) return res.status(404).json({ message: "Trip not found." });
    const shareToken = trip.shareToken || crypto.randomBytes(24).toString("hex");
    const sharedTrip = await prisma.trip.update({ where: { id: trip.id }, data: { isPublic: true, shareToken }, select: { id: true, isPublic: true, shareToken: true } });
    return res.json({ share: { ...sharedTrip, url: `/api/public/trips/${sharedTrip.shareToken}` } });
  } catch (error) { return next(error); }
}

async function disableShare(req, res, next) {
  try {
    const trip = await findOwnedTrip(req.params.tripId, req.auth.sub, { select: { id: true } });
    if (!trip) return res.status(404).json({ message: "Trip not found." });
    await prisma.trip.update({ where: { id: trip.id }, data: { isPublic: false, shareToken: null } });
    return res.status(204).send();
  } catch (error) { return next(error); }
}

async function getPublicTrip(req, res, next) {
  try {
    const trip = await prisma.trip.findFirst({ where: { shareToken: req.params.shareToken, isPublic: true }, include: publicTripInclude });
    if (!trip) return res.status(404).json({ message: "Public trip not found." });
    return res.json({ trip });
  } catch (error) { return next(error); }
}

async function copyPublicTrip(req, res, next) {
  try {
    const source = await prisma.trip.findFirst({ where: { shareToken: req.params.shareToken, isPublic: true }, include: publicTripInclude });
    if (!source) return res.status(404).json({ message: "Public trip not found." });
    const trip = await prisma.$transaction(async (tx) => {
      const copy = await tx.trip.create({ data: { userId: req.auth.sub, name: `${source.name} (Copy)`, description: source.description, startDate: source.startDate, endDate: source.endDate, budget: source.budget, coverImage: source.coverImage } });
      for (const stop of source.stops) {
        const copiedStop = await tx.tripStop.create({ data: { tripId: copy.id, cityId: stop.cityId, arrivalDate: stop.arrivalDate, departureDate: stop.departureDate, stopOrder: stop.stopOrder } });
        for (const activity of stop.plannedActivities) await tx.plannedActivity.create({ data: { tripStopId: copiedStop.id, activityId: activity.activityId, name: activity.name, scheduledDate: activity.scheduledDate, scheduledTime: activity.scheduledTime, estimatedCost: activity.estimatedCost, durationMinutes: activity.durationMinutes, notes: activity.notes, activityOrder: activity.activityOrder } });
      }
      for (const transport of source.transports) await tx.transport.create({ data: { tripId: copy.id, fromCity: transport.fromCity, toCity: transport.toCity, mode: transport.mode, departureTime: transport.departureTime, arrivalTime: transport.arrivalTime, estimatedCost: transport.estimatedCost, provider: transport.provider } });
      for (const expense of source.expenses) await tx.expense.create({ data: { tripId: copy.id, category: expense.category, title: expense.title, amount: expense.amount, expenseDate: expense.expenseDate, notes: expense.notes } });
      return copy;
    });
    return res.status(201).json({ trip });
  } catch (error) { return next(error); }
}

module.exports = { enableShare, disableShare, getPublicTrip, copyPublicTrip };
