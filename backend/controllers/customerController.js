import prisma from '../utils/prisma.js';
import { sendSuccess, sendError } from '../utils/response.js';

const pick = (body, photoUrl) => {
  const { fullName, fatherName, grandfatherName, tazkiraNumber, province, district, village, currentAddress, permanentAddress, phoneNumber, occupation, notes } = body;
  const d = { fullName, fatherName, grandfatherName, tazkiraNumber, province, district, village, currentAddress, permanentAddress, phoneNumber, occupation, notes };
  if (photoUrl !== undefined) d.photo = photoUrl;
  return d;
};

export const getCustomers = async (req, res) => {
  try {
    const { search } = req.query;
    const where = search ? { OR: [
      { fullName: { contains: search, mode: 'insensitive' } },
      { phoneNumber: { contains: search } },
      { tazkiraNumber: { contains: search } },
    ]} : {};
    const customers = await prisma.customer.findMany({ where, orderBy: { createdAt: 'desc' }, include: { _count: { select: { rentalContracts: true } } } });
    sendSuccess(res, customers);
  } catch (err) { sendError(res, err.message); }
};

export const getCustomerById = async (req, res) => {
  try {
    const customer = await prisma.customer.findUnique({ where: { id: req.params.id }, include: { rentalContracts: { include: { car: true, guarantor: true }, orderBy: { createdAt: 'desc' } } } });
    if (!customer) return sendError(res, 'مشتری یافت نشد', 404);
    sendSuccess(res, customer);
  } catch (err) { sendError(res, err.message); }
};

export const createCustomer = async (req, res) => {
  try {
    const photoUrl = req.file ? `/uploads/customers/${req.file.filename}` : undefined;
    const customer = await prisma.customer.create({ data: pick(req.body, photoUrl) });
    sendSuccess(res, customer, 'مشتری موفقانه اضافه شد', 201);
  } catch (err) { sendError(res, err.message); }
};

export const updateCustomer = async (req, res) => {
  try {
    const photoUrl = req.file ? `/uploads/customers/${req.file.filename}` : undefined;
    const customer = await prisma.customer.update({ where: { id: req.params.id }, data: pick(req.body, photoUrl) });
    sendSuccess(res, customer, 'مشتری موفقانه بروز شد');
  } catch (err) { sendError(res, err.message); }
};

export const deleteCustomer = async (req, res) => {
  try {
    await prisma.customer.delete({ where: { id: req.params.id } });
    sendSuccess(res, null, 'مشتری موفقانه حذف شد');
  } catch (err) { sendError(res, err.message); }
};
