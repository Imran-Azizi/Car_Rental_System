import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const ownerLogin = async (req, res) => {
  try {
    const { phoneNumber, password } = req.body;
    if (!phoneNumber || !password) return sendError(res, 'شماره تلفن و رمز عبور الزامی است', 400);

    const owner = await prisma.carOwner.findFirst({ where: { phoneNumber } });
    if (!owner) return sendError(res, 'شماره تلفن یا رمز عبور اشتباه است', 401);
    if (!owner.password) return sendError(res, 'برای این حساب رمز عبور تنظیم نشده است. با مدیر تماس بگیرید.', 401);

    const valid = await bcrypt.compare(password, owner.password);
    if (!valid) return sendError(res, 'شماره تلفن یا رمز عبور اشتباه است', 401);

    const token = jwt.sign(
      { id: owner.id, phoneNumber: owner.phoneNumber, type: 'owner' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    sendSuccess(res, {
      token,
      owner: { id: owner.id, fullName: owner.fullName, phoneNumber: owner.phoneNumber, photo: owner.photo }
    }, 'خوش آمدید');
  } catch (err) {
    sendError(res, err.message);
  }
};

export const ownerGetMe = async (req, res) => {
  try {
    const owner = await prisma.carOwner.findUnique({
      where: { id: req.owner.id },
      select: { id: true, fullName: true, fatherName: true, tazkiraNumber: true, phoneNumber: true, address: true, photo: true, createdAt: true }
    });
    if (!owner) return sendError(res, 'حساب یافت نشد', 404);
    sendSuccess(res, owner);
  } catch (err) {
    sendError(res, err.message);
  }
};
