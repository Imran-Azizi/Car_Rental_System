import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return sendError(res, 'ایمیل یا رمز اشتباه است', 401);
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return sendError(res, 'ایمیل یا رمز اشتباه است', 401);
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
    sendSuccess(res, { token, user: { id: user.id, name: user.name, email: user.email, role: user.role } }, 'خوش آمدید');
  } catch (err) {
    sendError(res, err.message);
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id }, select: { id: true, name: true, email: true, role: true } });
    sendSuccess(res, user);
  } catch (err) {
    sendError(res, err.message);
  }
};
