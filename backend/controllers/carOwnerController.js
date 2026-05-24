import bcrypt from 'bcryptjs';
import prisma from '../utils/prisma.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { deleteUploadedFile } from '../utils/fileUtils.js';
import { getFileUrl, cleanupFile } from '../utils/storage.js';

const sanitize = (owner) => {
  if (!owner) return owner;
  const { password, ...safe } = owner;
  return safe;
};

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const getCarOwners = async (req, res) => {
  try {
    const { search } = req.query;
    const where = {};
    if (search) where.OR = [
      { fullName:      { contains: search, mode: 'insensitive' } },
      { phoneNumber:   { contains: search, mode: 'insensitive' } },
      { tazkiraNumber: { contains: search, mode: 'insensitive' } },
      { email:         { contains: search, mode: 'insensitive' } },
    ];
    const owners = await prisma.carOwner.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { cars: true } } },
    });
    sendSuccess(res, owners.map(sanitize));
  } catch (err) { sendError(res, err.message); }
};

export const getCarOwnerById = async (req, res) => {
  try {
    const owner = await prisma.carOwner.findUnique({
      where: { id: req.params.id },
      include: { cars: true },
    });
    if (!owner) return sendError(res, 'صاحب موتر یافت نشد', 404);
    sendSuccess(res, sanitize(owner));
  } catch (err) { sendError(res, err.message); }
};

export const createCarOwner = async (req, res) => {
  try {
    const { fullName, fatherName, tazkiraNumber, phoneNumber, address, email, password } = req.body;

    if (!fullName || !fatherName || !phoneNumber) {
      cleanupFile(req.file);
      return sendError(res, 'فیلدهای الزامی را پر کنید', 400);
    }

    if (email && !isValidEmail(email)) {
      cleanupFile(req.file);
      return sendError(res, 'فرمت ایمیل صحیح نیست', 400);
    }

    if (email) {
      const existing = await prisma.carOwner.findFirst({ where: { email } });
      if (existing) {
        cleanupFile(req.file);
        return sendError(res, 'این ایمیل قبلاً ثبت شده است', 400);
      }
    }

    if (password && password.length < 6) {
      cleanupFile(req.file);
      return sendError(res, 'رمز عبور باید حداقل ۶ کاراکتر باشد', 400);
    }

    const photo = getFileUrl(req.file, 'owners') ?? null;
    const hashedPassword = password ? await bcrypt.hash(password, 12) : null;

    const owner = await prisma.carOwner.create({
      data: {
        fullName, fatherName,
        tazkiraNumber: tazkiraNumber || null,
        photo, phoneNumber,
        address:  address  || null,
        email:    email    || null,
        password: hashedPassword,
      },
    });
    sendSuccess(res, sanitize(owner), 'صاحب موتر موفقانه اضافه شد', 201);
  } catch (err) {
    if (err.code === 'P2002') return sendError(res, 'این ایمیل قبلاً ثبت شده است', 400);
    sendError(res, err.message);
  }
};

export const updateCarOwner = async (req, res) => {
  try {
    const existing = await prisma.carOwner.findUnique({ where: { id: req.params.id } });
    if (!existing) return sendError(res, 'صاحب موتر یافت نشد', 404);

    const { fullName, fatherName, tazkiraNumber, phoneNumber, address, email, password } = req.body;

    if (email && !isValidEmail(email)) {
      cleanupFile(req.file);
      return sendError(res, 'فرمت ایمیل صحیح نیست', 400);
    }

    if (email && email !== existing.email) {
      const duplicate = await prisma.carOwner.findFirst({ where: { email, NOT: { id: req.params.id } } });
      if (duplicate) {
        cleanupFile(req.file);
        return sendError(res, 'این ایمیل قبلاً ثبت شده است', 400);
      }
    }

    if (password && password.length < 6) {
      cleanupFile(req.file);
      return sendError(res, 'رمز عبور باید حداقل ۶ کاراکتر باشد', 400);
    }

    let photo = existing.photo;
    if (req.file) {
      if (existing.photo) deleteUploadedFile(existing.photo);
      photo = getFileUrl(req.file, 'owners');
    }

    const updateData = {
      fullName, fatherName,
      tazkiraNumber: tazkiraNumber || null,
      photo, phoneNumber,
      address: address || null,
      email:   email   || null,
    };

    if (password && password.trim()) {
      updateData.password = await bcrypt.hash(password, 12);
    }

    const owner = await prisma.carOwner.update({
      where: { id: req.params.id },
      data: updateData,
    });
    sendSuccess(res, sanitize(owner), 'صاحب موتر موفقانه بروز شد');
  } catch (err) {
    if (err.code === 'P2002') return sendError(res, 'این ایمیل قبلاً ثبت شده است', 400);
    sendError(res, err.message);
  }
};

export const deleteCarOwner = async (req, res) => {
  try {
    const existing = await prisma.carOwner.findUnique({ where: { id: req.params.id } });
    if (!existing) return sendError(res, 'صاحب موتر یافت نشد', 404);

    if (existing.photo) deleteUploadedFile(existing.photo);

    await prisma.carOwner.delete({ where: { id: req.params.id } });
    sendSuccess(res, null, 'صاحب موتر موفقانه حذف شد');
  } catch (err) {
    if (err.code === 'P2003') return sendError(res, 'این صاحب موتر دارای موترهای ثبت شده است و قابل حذف نیست', 400);
    sendError(res, err.message);
  }
};
