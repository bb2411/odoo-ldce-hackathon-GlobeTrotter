const prisma = require("../lib/Prisma");
const { findOwnedTrip, isValidDate, toDate } = require("../utils/trip");

async function ownedStop(tripId, stopId, userId) {
  return prisma.tripStop.findFirst({ where: { id: stopId, tripId, trip: { userId } } });
}

async function addPlannedActivity(req, res, next) {
  try {
    const { name, activityId, scheduledDate, scheduledTime, estimatedCost, durationMinutes, notes } = req.body;
    if (typeof name !== "string" || !name.trim() || !isValidDate(scheduledDate)) return res.status(400).json({ message: "name and a valid scheduledDate are required." });
    const stop = await ownedStop(req.params.tripId, req.params.stopId, req.auth.sub);
    if (!stop) return res.status(404).json({ message: "Trip stop not found." });
    if (activityId) {
      const activity = await prisma.activity.findFirst({ where: { id: activityId, cityId: stop.cityId }, select: { id: true } });
      if (!activity) return res.status(400).json({ message: "Activity must belong to this stop's city." });
    }
    const count = await prisma.plannedActivity.count({ where: { tripStopId: stop.id } });
    const plannedActivity = await prisma.plannedActivity.create({
      data: { tripStopId: stop.id, activityId: activityId || null, name: name.trim(), scheduledDate: toDate(scheduledDate), scheduledTime: scheduledTime ? toDate(scheduledTime) : null, estimatedCost: estimatedCost ?? null, durationMinutes: durationMinutes ?? null, notes: notes?.trim() || null, activityOrder: count },
      include: { activity: true },
    });
    return res.status(201).json({ plannedActivity });
  } catch (error) { return next(error); }
}

async function removePlannedActivity(req, res, next) {
  try {
    const plannedActivity = await prisma.plannedActivity.findFirst({ where: { id: req.params.plannedActivityId, tripStop: { tripId: req.params.tripId, trip: { userId: req.auth.sub } } }, select: { id: true } });
    if (!plannedActivity) return res.status(404).json({ message: "Planned activity not found." });
    await prisma.plannedActivity.delete({ where: { id: plannedActivity.id } });
    return res.status(204).send();
  } catch (error) { return next(error); }
}

async function updatePlannedActivity(req, res, next) {
  try {
    const existing = await prisma.plannedActivity.findFirst({ where: { id: req.params.plannedActivityId, tripStop: { tripId: req.params.tripId, trip: { userId: req.auth.sub } } }, include: { tripStop: true } });
    if (!existing) return res.status(404).json({ message: "Planned activity not found." });
    const { name, activityId, scheduledDate, scheduledTime, estimatedCost, durationMinutes, notes } = req.body;
    if (name !== undefined && (typeof name !== "string" || !name.trim())) return res.status(400).json({ message: "name cannot be empty." });
    if (scheduledDate !== undefined && !isValidDate(scheduledDate)) return res.status(400).json({ message: "scheduledDate must be a valid date." });
    if (activityId) {
      const activity = await prisma.activity.findFirst({ where: { id: activityId, cityId: existing.tripStop.cityId }, select: { id: true } });
      if (!activity) return res.status(400).json({ message: "Activity must belong to this stop's city." });
    }
    const data = { ...(name !== undefined ? { name: name.trim() } : {}), ...(activityId !== undefined ? { activityId: activityId || null } : {}), ...(scheduledDate !== undefined ? { scheduledDate: toDate(scheduledDate) } : {}), ...(scheduledTime !== undefined ? { scheduledTime: scheduledTime ? toDate(scheduledTime) : null } : {}), ...(estimatedCost !== undefined ? { estimatedCost } : {}), ...(durationMinutes !== undefined ? { durationMinutes } : {}), ...(notes !== undefined ? { notes: notes?.trim() || null } : {}) };
    const plannedActivity = await prisma.plannedActivity.update({ where: { id: existing.id }, data, include: { activity: true } });
    return res.json({ plannedActivity });
  } catch (error) { return next(error); }
}

async function reorderPlannedActivities(req, res, next) {
  try {
    const { plannedActivityIds } = req.body;
    if (!Array.isArray(plannedActivityIds) || new Set(plannedActivityIds).size !== plannedActivityIds.length) return res.status(400).json({ message: "plannedActivityIds must be a unique array." });
    const stop = await ownedStop(req.params.tripId, req.params.stopId, req.auth.sub);
    if (!stop) return res.status(404).json({ message: "Trip stop not found." });
    const activities = await prisma.plannedActivity.findMany({ where: { tripStopId: stop.id }, select: { id: true } });
    if (activities.length !== plannedActivityIds.length || activities.some((activity) => !plannedActivityIds.includes(activity.id))) return res.status(400).json({ message: "plannedActivityIds must contain every activity in this stop exactly once." });
    await prisma.$transaction(plannedActivityIds.map((id, activityOrder) => prisma.plannedActivity.update({ where: { id }, data: { activityOrder } })));
    const plannedActivities = await prisma.plannedActivity.findMany({ where: { tripStopId: stop.id }, orderBy: { activityOrder: "asc" }, include: { activity: true } });
    return res.json({ plannedActivities });
  } catch (error) { return next(error); }
}

async function getItinerary(req, res, next) {
  try {
    const trip = await findOwnedTrip(req.params.tripId, req.auth.sub, { include: { stops: { orderBy: { stopOrder: "asc" }, include: { city: true, plannedActivities: { orderBy: [{ scheduledDate: "asc" }, { activityOrder: "asc" }], include: { activity: true } } } } } });
    if (!trip) return res.status(404).json({ message: "Trip not found." });
    const days = [];
    for (let date = new Date(trip.startDate); date <= trip.endDate; date.setUTCDate(date.getUTCDate() + 1)) {
      const day = new Date(date);
      const key = day.toISOString().slice(0, 10);
      const stops = trip.stops.filter((stop) => stop.arrivalDate <= day && stop.departureDate >= day).map((stop) => ({ ...stop, plannedActivities: stop.plannedActivities.filter((activity) => activity.scheduledDate.toISOString().slice(0, 10) === key) }));
      days.push({ date: key, stops });
    }
    return res.json({ trip: { id: trip.id, name: trip.name, startDate: trip.startDate, endDate: trip.endDate }, days });
  } catch (error) { return next(error); }
}

async function addExpense(req, res, next) {
  try {
    const { category, title, amount, expenseDate, notes } = req.body;
    if (!category || typeof title !== "string" || !title.trim() || amount === undefined || Number.isNaN(Number(amount)) || Number(amount) < 0) return res.status(400).json({ message: "category, title, and a non-negative amount are required." });
    const trip = await findOwnedTrip(req.params.tripId, req.auth.sub, { select: { id: true } });
    if (!trip) return res.status(404).json({ message: "Trip not found." });
    const expense = await prisma.expense.create({ data: { tripId: trip.id, category, title: title.trim(), amount, expenseDate: expenseDate ? toDate(expenseDate) : null, notes: notes?.trim() || null } });
    return res.status(201).json({ expense });
  } catch (error) { return next(error); }
}

async function updateExpense(req, res, next) {
  try {
    const expense = await prisma.expense.findFirst({ where: { id: req.params.expenseId, tripId: req.params.tripId, trip: { userId: req.auth.sub } }, select: { id: true } });
    if (!expense) return res.status(404).json({ message: "Expense not found." });
    const { category, title, amount, expenseDate, notes } = req.body;
    if (title !== undefined && (typeof title !== "string" || !title.trim())) return res.status(400).json({ message: "title cannot be empty." });
    if (amount !== undefined && (Number.isNaN(Number(amount)) || Number(amount) < 0)) return res.status(400).json({ message: "amount must be non-negative." });
    const updatedExpense = await prisma.expense.update({ where: { id: expense.id }, data: { ...(category !== undefined ? { category } : {}), ...(title !== undefined ? { title: title.trim() } : {}), ...(amount !== undefined ? { amount } : {}), ...(expenseDate !== undefined ? { expenseDate: expenseDate ? toDate(expenseDate) : null } : {}), ...(notes !== undefined ? { notes: notes?.trim() || null } : {}) } });
    return res.json({ expense: updatedExpense });
  } catch (error) { return next(error); }
}

async function removeExpense(req, res, next) {
  try {
    const expense = await prisma.expense.findFirst({ where: { id: req.params.expenseId, tripId: req.params.tripId, trip: { userId: req.auth.sub } }, select: { id: true } });
    if (!expense) return res.status(404).json({ message: "Expense not found." });
    await prisma.expense.delete({ where: { id: expense.id } });
    return res.status(204).send();
  } catch (error) { return next(error); }
}

async function addTransport(req, res, next) {
  try {
    const { fromCity, toCity, mode, departureTime, arrivalTime, estimatedCost, provider } = req.body;
    if (!["FLIGHT", "TRAIN", "BUS", "CAR", "FERRY", "OTHER"].includes(mode) || !fromCity?.trim() || !toCity?.trim()) return res.status(400).json({ message: "fromCity, toCity, and a valid mode are required." });
    const trip = await findOwnedTrip(req.params.tripId, req.auth.sub, { select: { id: true } });
    if (!trip) return res.status(404).json({ message: "Trip not found." });
    const transport = await prisma.transport.create({ data: { tripId: trip.id, fromCity: fromCity.trim(), toCity: toCity.trim(), mode, departureTime: departureTime ? toDate(departureTime) : null, arrivalTime: arrivalTime ? toDate(arrivalTime) : null, estimatedCost: estimatedCost ?? null, provider: provider?.trim() || null } });
    return res.status(201).json({ transport });
  } catch (error) { return next(error); }
}

async function updateTransport(req, res, next) {
  try {
    const transport = await prisma.transport.findFirst({ where: { id: req.params.transportId, tripId: req.params.tripId, trip: { userId: req.auth.sub } }, select: { id: true } });
    if (!transport) return res.status(404).json({ message: "Transport entry not found." });
    const { fromCity, toCity, mode, departureTime, arrivalTime, estimatedCost, provider } = req.body;
    if (mode !== undefined && !["FLIGHT", "TRAIN", "BUS", "CAR", "FERRY", "OTHER"].includes(mode)) return res.status(400).json({ message: "mode is invalid." });
    const updatedTransport = await prisma.transport.update({ where: { id: transport.id }, data: { ...(fromCity !== undefined ? { fromCity: fromCity.trim() } : {}), ...(toCity !== undefined ? { toCity: toCity.trim() } : {}), ...(mode !== undefined ? { mode } : {}), ...(departureTime !== undefined ? { departureTime: departureTime ? toDate(departureTime) : null } : {}), ...(arrivalTime !== undefined ? { arrivalTime: arrivalTime ? toDate(arrivalTime) : null } : {}), ...(estimatedCost !== undefined ? { estimatedCost } : {}), ...(provider !== undefined ? { provider: provider?.trim() || null } : {}) } });
    return res.json({ transport: updatedTransport });
  } catch (error) { return next(error); }
}

async function removeTransport(req, res, next) {
  try {
    const transport = await prisma.transport.findFirst({ where: { id: req.params.transportId, tripId: req.params.tripId, trip: { userId: req.auth.sub } }, select: { id: true } });
    if (!transport) return res.status(404).json({ message: "Transport entry not found." });
    await prisma.transport.delete({ where: { id: transport.id } });
    return res.status(204).send();
  } catch (error) { return next(error); }
}

async function getBudget(req, res, next) {
  try {
    const trip = await findOwnedTrip(req.params.tripId, req.auth.sub, { include: { expenses: true, transports: true, stops: { include: { plannedActivities: true } } } });
    if (!trip) return res.status(404).json({ message: "Trip not found." });
    const breakdown = {};
    const add = (key, amount) => { breakdown[key] = (breakdown[key] || 0) + Number(amount || 0); };
    for (const expense of trip.expenses) add(expense.category, expense.amount);
    for (const transport of trip.transports) add("TRANSPORT", transport.estimatedCost);
    for (const stop of trip.stops) for (const activity of stop.plannedActivities) add("ACTIVITY", activity.estimatedCost);
    const estimatedTotal = Object.values(breakdown).reduce((total, amount) => total + amount, 0);
    const tripDays = Math.max(1, Math.ceil((trip.endDate - trip.startDate) / 86400000) + 1);
    return res.json({ budget: trip.budget, estimatedTotal, remaining: trip.budget === null ? null : Number(trip.budget) - estimatedTotal, averagePerDay: estimatedTotal / tripDays, breakdown });
  } catch (error) { return next(error); }
}

module.exports = { addPlannedActivity, updatePlannedActivity, removePlannedActivity, reorderPlannedActivities, getItinerary, addExpense, updateExpense, removeExpense, addTransport, updateTransport, removeTransport, getBudget };
