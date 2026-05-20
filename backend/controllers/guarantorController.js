import prisma from '../utils/prisma.js';
import { sendSuccess, sendError } from '../utils/response.js';

const pick = (body, photoUrl) => {
  const { fullName, fatherName, grandfatherName, tazkiraNumber, province, district, village, currentAddress, permanentAddress, phoneNumber, relationship, notes } = body;
  const d = { fullName, fatherName, grandfatherName, tazkiraNumber, province, district, village, currentAddress, permanentAddress, phoneNumber, relationship, notes };
  if (photoUrl !== undefined) d.photo = photoUrl;
  return d;
};

export const getGuarantors = async (req, res) => {
  try {
    const { search } = req.query;
    const where = search ? { OR: [
      { fullName: { contains: search, mode: 'insensitive' } },
      { phoneNumber: { contains: search } },
    ]} : {};
    const guarantors = await prisma.guarantor.findMany({ where, orderBy: { createdAt: 'desc' }, include: { _count: { select: { rentalContracts: true } } } });
    sendSuccess(res, guarantors);
  } catch (err) { sendError(res, err.message); }
};

export const createGuarantor = async (req, res) => {
  try {
    const photoUrl = req.file ? `/uploads/guarantors/${req.file.filename}` : undefined;
    const guarantor = await prisma.guarantor.create({ data: pick(req.body, photoUrl) });
    sendSuccess(res, guarantor, 'ضامن موفقانه اضافه شد', 201);
  } catch (err) { sendError(res, err.message); }
};

export const updateGuarantor = async (req, res) => {
  try {
    const photoUrl = req.file ? `/uploads/guarantors/${req.file.filename}` : undefined;
    const guarantor = await prisma.guarantor.update({ where: { id: req.params.id }, data: pick(req.body, photoUrl) });
    sendSuccess(res, guarantor, 'ضامن موفقانه بروز شد');
  } catch (err) { sendError(res, err.message); }
};

export const deleteGuarantor = async (req, res) => {
  try {
    await prisma.guarantor.delete({ where: { id: req.params.id } });
    sendSuccess(res, null, 'ضامن موفقانه حذف شد');
  } catch (err) { sendError(res, err.message); }
};

export const getGuarantorById = async (req, res) => {
  try {
    const g = await prisma.guarantor.findUnique({ where: { id: req.params.id } });
    if (!g) return sendError(res, 'ضامن یافت نشد', 404);
    sendSuccess(res, g);
  } catch (err) { sendError(res, err.message); }
};
