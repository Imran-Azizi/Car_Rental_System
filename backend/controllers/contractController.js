import prisma from '../utils/prisma.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { generateContractNumber } from '../utils/generateContractNumber.js';

export const getContracts = async (req, res) => {
  try {
    const { status, search } = req.query;
    const where = {};
    if (status) where.status = status;
    if (search) where.OR = [
      { contractNumber: { contains: search, mode: 'insensitive' } },
      { customer: { fullName: { contains: search, mode: 'insensitive' } } },
      { customer: { phoneNumber: { contains: search } } },
      { car: { plateNumber: { contains: search, mode: 'insensitive' } } },
    ];
    const contracts = await prisma.rentalContract.findMany({
      where, orderBy: { createdAt: 'desc' },
      include: { car: true, customer: true, guarantor: true, payments: true }
    });
    sendSuccess(res, contracts);
  } catch (err) { sendError(res, err.message); }
};

export const getContractById = async (req, res) => {
  try {
    const contract = await prisma.rentalContract.findUnique({
      where: { id: req.params.id },
      include: { car: true, customer: true, guarantor: true, payments: { orderBy: { createdAt: 'desc' } } }
    });
    if (!contract) return sendError(res, 'قرارداد یافت نشد', 404);
    sendSuccess(res, contract);
  } catch (err) { sendError(res, err.message); }
};

export const createContract = async (req, res) => {
  try {
    const contractNumber = generateContractNumber();
    const data = { ...req.body, contractNumber };
    const contract = await prisma.rentalContract.create({
      data, include: { car: true, customer: true, guarantor: true }
    });
    // Update car status to RENTED
    await prisma.car.update({ where: { id: data.carId }, data: { status: 'RENTED' } });
    // Record advance payment if any
    if (data.advancePayment > 0) {
      await prisma.payment.create({ data: { contractId: contract.id, amount: data.advancePayment, notes: 'پیش پرداخت' } });
    }
    sendSuccess(res, contract, 'قرارداد موفقانه ثبت شد', 201);
  } catch (err) { sendError(res, err.message); }
};

export const updateContract = async (req, res) => {
  try {
    const contract = await prisma.rentalContract.update({ where: { id: req.params.id }, data: req.body, include: { car: true, customer: true } });
    sendSuccess(res, contract, 'قرارداد موفقانه بروز شد');
  } catch (err) { sendError(res, err.message); }
};

export const markAsReturned = async (req, res) => {
  try {
    const contract = await prisma.rentalContract.update({
      where: { id: req.params.id },
      data: { status: 'COMPLETED' },
      include: { car: true }
    });
    await prisma.car.update({ where: { id: contract.carId }, data: { status: 'AVAILABLE' } });
    sendSuccess(res, contract, 'موتر موفقانه برگشت داده شد');
  } catch (err) { sendError(res, err.message); }
};

export const addPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, paymentMethod, notes } = req.body;
    const payment = await prisma.payment.create({ data: { contractId: id, amount: parseFloat(amount), paymentMethod, notes } });
    const contract = await prisma.rentalContract.findUnique({ where: { id }, include: { payments: true } });
    const totalPaid = contract.payments.reduce((s, p) => s + p.amount, 0);
    const remaining = contract.totalRent - totalPaid;
    await prisma.rentalContract.update({ where: { id }, data: { remainingAmount: Math.max(0, remaining) } });
    sendSuccess(res, payment, 'پرداخت موفقانه ثبت شد', 201);
  } catch (err) { sendError(res, err.message); }
};

export const deleteContract = async (req, res) => {
  try {
    const contract = await prisma.rentalContract.findUnique({ where: { id: req.params.id } });
    await prisma.payment.deleteMany({ where: { contractId: req.params.id } });
    await prisma.rentalContract.delete({ where: { id: req.params.id } });
    if (contract) await prisma.car.update({ where: { id: contract.carId }, data: { status: 'AVAILABLE' } }).catch(() => {});
    sendSuccess(res, null, 'قرارداد موفقانه حذف شد');
  } catch (err) { sendError(res, err.message); }
};
