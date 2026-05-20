import prisma from '../utils/prisma.js';
import { sendSuccess, sendError } from '../utils/response.js';
import fs from 'fs';
import path from 'path';

export const getCarOwners = async (req, res) => {
  try {
    const { search } = req.query;
    const where = {};
    if (search) where.OR = [
      { fullName: { contains: search, mode: 'insensitive' } },
      { phoneNumber: { contains: search, mode: 'insensitive' } },
      { tazkiraNumber: { contains: search, mode: 'insensitive' } },
    ];
    const owners = await prisma.carOwner.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { cars: true } } },
    });
    sendSuccess(res, owners);
  } catch (err) { sendError(res, err.message); }
};

export const getCarOwnerById = async (req, res) => {
  try {
    const owner = await prisma.carOwner.findUnique({
      where: { id: req.params.id },
      include: { cars: true },
    });
    if (!owner) return sendError(res, 'صاحب موتر یافت نشد', 404);
    sendSuccess(res, owner);
  } catch (err) { sendError(res, err.message); }
};

export const createCarOwner = async (req, res) => {
  try {
    const { fullName, fatherName, tazkiraNumber, phoneNumber, address } = req.body;
    if (!fullName || !fatherName || !phoneNumber) {
      if (req.file) fs.unlinkSync(req.file.path);
      return sendError(res, 'فیلدهای الزامی را پر کنید', 400);
    }
    const photo = req.file ? `/uploads/owners/${req.file.filename}` : null;
    const owner = await prisma.carOwner.create({
      data: { fullName, fatherName, tazkiraNumber: tazkiraNumber || null, photo, phoneNumber, address: address || null },
    });
    sendSuccess(res, owner, 'صاحب موتر موفقانه اضافه شد', 201);
  } catch (err) { sendError(res, err.message); }
};

export const updateCarOwner = async (req, res) => {
  try {
    const existing = await prisma.carOwner.findUnique({ where: { id: req.params.id } });
    if (!existing) return sendError(res, 'صاحب موتر یافت نشد', 404);

    const { fullName, fatherName, tazkiraNumber, phoneNumber, address } = req.body;
    let photo = existing.photo;

    if (req.file) {
      // Delete old photo if exists
      if (existing.photo) {
        const oldPath = path.join(process.cwd(), 'uploads', 'owners', path.basename(existing.photo));
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      photo = `/uploads/owners/${req.file.filename}`;
    }

    const owner = await prisma.carOwner.update({
      where: { id: req.params.id },
      data: { fullName, fatherName, tazkiraNumber: tazkiraNumber || null, photo, phoneNumber, address: address || null },
    });
    sendSuccess(res, owner, 'صاحب موتر موفقانه بروز شد');
  } catch (err) { sendError(res, err.message); }
};

export const deleteCarOwner = async (req, res) => {
  try {
    const existing = await prisma.carOwner.findUnique({ where: { id: req.params.id } });
    if (!existing) return sendError(res, 'صاحب موتر یافت نشد', 404);

    if (existing.photo) {
      const oldPath = path.join(process.cwd(), 'uploads', 'owners', path.basename(existing.photo));
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    await prisma.carOwner.delete({ where: { id: req.params.id } });
    sendSuccess(res, null, 'صاحب موتر موفقانه حذف شد');
  } catch (err) {
    if (err.code === 'P2003') return sendError(res, 'این صاحب موتر دارای موترهای ثبت شده است و قابل حذف نیست', 400);
    sendError(res, err.message);
  }
};
