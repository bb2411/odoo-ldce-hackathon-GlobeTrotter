const prisma = require("../lib/Prisma");

async function findOwnedTrip(tripId, userId, options = {}) {
  return prisma.trip.findFirst({
    where: { id: tripId, userId },
    ...options,
  });
}

function isValidDate(value) {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

function toDate(value) {
  return new Date(value);
}

module.exports = { findOwnedTrip, isValidDate, toDate };
