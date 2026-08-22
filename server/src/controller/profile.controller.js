const bcrypt = require("bcryptjs");
const prisma = require("../lib/Prisma");

const publicUserSelect = { id: true, name: true, email: true, profileImage: true, createdAt: true, updatedAt: true };

async function getProfile(req, res, next) {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.auth.sub }, select: publicUserSelect });
    if (!user) return res.status(404).json({ message: "User not found." });
    return res.json({ user });
  } catch (error) { return next(error); }
}

async function updateProfile(req, res, next) {
  try {
    const { name, email, profileImage } = req.body;
    if (name !== undefined && (typeof name !== "string" || name.trim().length < 2)) return res.status(400).json({ message: "Name must be at least 2 characters long." });
    if (email !== undefined && (typeof email !== "string" || !/^\S+@\S+\.\S+$/.test(email))) return res.status(400).json({ message: "A valid email address is required." });
    const data = { ...(name !== undefined ? { name: name.trim() } : {}), ...(email !== undefined ? { email: email.trim().toLowerCase() } : {}), ...(profileImage !== undefined ? { profileImage: profileImage?.trim() || null } : {}) };
    if (!Object.keys(data).length) return res.status(400).json({ message: "Provide at least one profile field to update." });
    const user = await prisma.user.update({ where: { id: req.auth.sub }, data, select: publicUserSelect });
    return res.json({ user });
  } catch (error) { return next(error); }
}

async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;
    if (typeof currentPassword !== "string" || typeof newPassword !== "string" || newPassword.length < 8) return res.status(400).json({ message: "currentPassword and a new password of at least 8 characters are required." });
    const user = await prisma.user.findUnique({ where: { id: req.auth.sub }, select: { passwordHash: true } });
    if (!user || !(await bcrypt.compare(currentPassword, user.passwordHash))) return res.status(401).json({ message: "Current password is incorrect." });
    await prisma.user.update({ where: { id: req.auth.sub }, data: { passwordHash: await bcrypt.hash(newPassword, 12) } });
    return res.status(204).send();
  } catch (error) { return next(error); }
}

async function deleteAccount(req, res, next) {
  try {
    const { password } = req.body;
    if (typeof password !== "string") return res.status(400).json({ message: "Password confirmation is required." });
    const user = await prisma.user.findUnique({ where: { id: req.auth.sub }, select: { id: true, passwordHash: true } });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) return res.status(401).json({ message: "Password is incorrect." });
    await prisma.user.delete({ where: { id: user.id } });
    return res.status(204).send();
  } catch (error) { return next(error); }
}

module.exports = { getProfile, updateProfile, changePassword, deleteAccount };
