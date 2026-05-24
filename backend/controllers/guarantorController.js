import prisma from '../utils/prisma.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { deleteUploadedFile } from '../utils/fileUtils.js';

const pick = (body, photoUrl, photo2Url) => {
  const { fullName, fatherName, grandfatherName, tazkiraNumber, province, district, village, currentAddress, permanentAddress, phoneNumber, relationship, notes } = body;
  const d = { fullName, fatherName, grandfatherName, tazkiraNumber, province, district, village, currentAddress, permanentAddress, phoneNumber, relationship, notes };
  if (photoUrl  !== undefined) d.photo  = photoUrl;
  if (photo2Url !== undefined) d.photo2 = photo2Url;
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

export const getGuarantorById = async (req, res) => {
  try {
    const g = await prisma.guarantor.findUnique({ where: { id: req.params.id } });
    if (!g) return sendError(res, 'ضامن یافت نشد', 404);
    sendSuccess(res, g);
  } catch (err) { sendError(res, err.message); }
};

const fileFromFields = (files, field) =>
  files?.[field]?.[0] ? `/uploads/guarantors/${files[field][0].filename}` : undefined;

export const createGuarantor = async (req, res) => {
  try {
    const photoUrl  = fileFromFields(req.files, 'photo');
    const photo2Url = fileFromFields(req.files, 'photo2');
    const guarantor = await prisma.guarantor.create({ data: pick(req.body, photoUrl, photo2Url) });
    sendSuccess(res, guarantor, 'ضامن موفقانه اضافه شد', 201);
  } catch (err) { sendError(res, err.message); }
};

export const updateGuarantor = async (req, res) => {
  try {
    let photoUrl, photo2Url;
    if (req.files?.photo?.[0]) {
      const existing = await prisma.guarantor.findUnique({ where: { id: req.params.id }, select: { photo: true } });
      if (existing?.photo) deleteUploadedFile(existing.photo);
      photoUrl = `/uploads/guarantors/${req.files.photo[0].filename}`;
    }
    if (req.files?.photo2?.[0]) {
      const existing = await prisma.guarantor.findUnique({ where: { id: req.params.id }, select: { photo2: true } });
      if (existing?.photo2) deleteUploadedFile(existing.photo2);
      photo2Url = `/uploads/guarantors/${req.files.photo2[0].filename}`;
    }
    const guarantor = await prisma.guarantor.update({ where: { id: req.params.id }, data: pick(req.body, photoUrl, photo2Url) });
    sendSuccess(res, guarantor, 'ضامن موفقانه بروز شد');
  } catch (err) { sendError(res, err.message); }
};

export const deleteGuarantor = async (req, res) => {
  try {
    const existing = await prisma.guarantor.findUnique({ where: { id: req.params.id }, select: { photo: true } });
    if (!existing) return sendError(res, 'ضامن یافت نشد', 404);
    await prisma.guarantor.delete({ where: { id: req.params.id } });
    deleteUploadedFile(existing.photo);
    sendSuccess(res, null, 'ضامن موفقانه حذف شد');
  } catch (err) { sendError(res, err.message); }
};
