import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma.js';
import { sendSuccess, sendError } from '../utils/response.js';

const sign = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

// In production: sameSite='none' + secure=true required for cross-origin (Vercel → Railway)
const isProd = process.env.NODE_ENV === 'production';
const COOKIE_OPTS = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/',
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return sendError(res, 'ایمیل و رمز عبور الزامی است', 400);

    // 1. Check Admin/Staff
    const admin = await prisma.user.findUnique({ where: { email } });
    if (admin) {
      const valid = await bcrypt.compare(password, admin.password);
      if (!valid) return sendError(res, 'ایمیل یا رمز عبور اشتباه است', 401);
      const token = sign({ id: admin.id, email: admin.email, role: admin.role, type: 'admin' });
      res.cookie('authToken', token, COOKIE_OPTS);
      return sendSuccess(res, {
        token,
        role: 'admin',
        user: { id: admin.id, name: admin.name, email: admin.email, role: admin.role },
      }, 'خوش آمدید');
    }

    // 2. Check Car Owner
    const owner = await prisma.carOwner.findFirst({ where: { email } });
    if (!owner) return sendError(res, 'ایمیل یا رمز عبور اشتباه است', 401);
    if (!owner.password) return sendError(res, 'برای این حساب رمز عبور تنظیم نشده. لطفاً با مدیر تماس بگیرید.', 401);
    const valid = await bcrypt.compare(password, owner.password);
    if (!valid) return sendError(res, 'ایمیل یا رمز عبور اشتباه است', 401);

    const token = sign({ id: owner.id, email: owner.email, type: 'owner' });
    res.cookie('ownerToken', token, COOKIE_OPTS);
    return sendSuccess(res, {
      token,
      role: 'owner',
      user: { id: owner.id, fullName: owner.fullName, email: owner.email, phoneNumber: owner.phoneNumber, photo: owner.photo },
    }, 'خوش آمدید');
  } catch (err) {
    sendError(res, err.message);
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, email: true, role: true },
    });
    sendSuccess(res, user);
  } catch (err) {
    sendError(res, err.message);
  }
};

export const refresh = (req, res) => {
  const token = req.cookies?.authToken || req.headers.authorization?.split(' ')[1];
  if (!token) return sendError(res, 'توکن موجود نیست', 401);
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.type === 'owner') return sendError(res, 'غیرمجاز', 403);
    const newToken = sign({ id: decoded.id, email: decoded.email, role: decoded.role, type: 'admin' });
    res.cookie('authToken', newToken, COOKIE_OPTS);
    sendSuccess(res, { token: newToken }, 'توکن تجدید شد');
  } catch {
    res.clearCookie('authToken', { path: '/' });
    sendError(res, 'توکن نامعتبر است', 401);
  }
};

export const logout = (req, res) => {
  res.clearCookie('authToken', { path: '/' });
  sendSuccess(res, null, 'خروج موفق');
};
