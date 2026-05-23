import prisma from '../utils/prisma.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { generateContractNumber } from '../utils/generateContractNumber.js';
import { deleteUploadedFiles } from '../utils/fileUtils.js';

// Profit-sharing ratio — owner gets 50%, admin keeps 50%
const OWNER_SHARE_PCT = parseFloat(process.env.OWNER_SHARE_PCT || '0.50');

function calcShares(totalRent) {
  const total = parseFloat(totalRent) || 0;
  const ownerShare = Math.round(total * OWNER_SHARE_PCT * 100) / 100;
  const adminShare = Math.round((total - ownerShare) * 100) / 100;
  return { ownerShare, adminShare };
}

/** Extract uploaded file URL or return undefined */
function fileUrl(files, field) {
  return files?.[field]?.[0] ? `/uploads/contracts/${files[field][0].filename}` : undefined;
}

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
      where,
      orderBy: { createdAt: 'desc' },
      include: { car: true, customer: true, guarantor: true, payments: true },
    });
    sendSuccess(res, contracts);
  } catch (err) { sendError(res, err.message); }
};

export const getContractById = async (req, res) => {
  try {
    const contract = await prisma.rentalContract.findUnique({
      where: { id: req.params.id },
      include: { car: true, customer: true, guarantor: true, payments: { orderBy: { createdAt: 'desc' } } },
    });
    if (!contract) return sendError(res, 'قرارداد یافت نشد', 404);
    sendSuccess(res, contract);
  } catch (err) { sendError(res, err.message); }
};

export const createContract = async (req, res) => {
  try {
    const rentPrice  = parseFloat(req.body.rentPrice)  || 0;
    const totalRent  = parseFloat(req.body.totalRent)  || 0;
    const advance    = parseFloat(req.body.advancePayment) || 0;
    const remaining  = parseFloat(req.body.remainingAmount);

    if (rentPrice  < 0) return sendError(res, 'کرایه روزانه نمی‌تواند منفی باشد', 400);
    if (totalRent  < 0) return sendError(res, 'مجموع کرایه نمی‌تواند منفی باشد', 400);
    if (advance    < 0) return sendError(res, 'پیش پرداخت نمی‌تواند منفی باشد', 400);
    if (!isNaN(remaining) && remaining < 0) return sendError(res, 'باقی مانده نمی‌تواند منفی باشد', 400);

    const contractNumber = generateContractNumber();
    const { ownerShare, adminShare } = calcShares(req.body.totalRent);

    const billDocPhoto    = fileUrl(req.files, 'billDocPhoto');
    const tazkiraDocPhoto = fileUrl(req.files, 'tazkiraDocPhoto');

    const data = {
      carId:              req.body.carId,
      customerId:         req.body.customerId,
      ...(req.body.guarantorId && { guarantorId: req.body.guarantorId }),
      startDate:          new Date(req.body.startDate),
      startTime:          req.body.startTime || '00:00',
      endDate:            new Date(req.body.endDate),
      endTime:            req.body.endTime   || '00:00',
      rentPrice,
      totalRent,
      advancePayment:     advance,
      remainingAmount:    isNaN(remaining) ? Math.max(0, totalRent - advance) : remaining,
      carStatus:          req.body.carStatus  || null,
      agreementConfirmed: req.body.agreementConfirmed === true || req.body.agreementConfirmed === 'true',
      notes:              req.body.notes || null,
      contractNumber,
      ownerShare,
      adminShare,
      ...(billDocPhoto    !== undefined && { billDocPhoto }),
      ...(tazkiraDocPhoto !== undefined && { tazkiraDocPhoto }),
    };

    const contract = await prisma.rentalContract.create({
      data,
      include: { car: true, customer: true, guarantor: true },
    });

    // Mark car as rented
    await prisma.car.update({ where: { id: data.carId }, data: { status: 'RENTED' } });

    // Record advance payment
    if (advance > 0) {
      await prisma.payment.create({
        data: { contractId: contract.id, amount: advance, notes: 'پیش پرداخت' },
      });
    }

    sendSuccess(res, contract, 'سفارش موفقانه ثبت شد', 201);
  } catch (err) { sendError(res, err.message); }
};

export const updateContract = async (req, res) => {
  try {
    const updateData = { ...req.body };

    // Coerce string values from multipart/JSON body to the correct Prisma types
    ['rentPrice', 'totalRent', 'advancePayment', 'remainingAmount', 'ownerShare', 'adminShare'].forEach(f => {
      if (updateData[f] !== undefined) updateData[f] = parseFloat(updateData[f]) || 0;
    });
    if (updateData.agreementConfirmed !== undefined) {
      updateData.agreementConfirmed = updateData.agreementConfirmed === true || updateData.agreementConfirmed === 'true';
    }
    if (updateData.startDate) updateData.startDate = new Date(updateData.startDate);
    if (updateData.endDate)   updateData.endDate   = new Date(updateData.endDate);

    // Recalculate shares if totalRent changed
    if (updateData.totalRent !== undefined) {
      const { ownerShare, adminShare } = calcShares(updateData.totalRent);
      updateData.ownerShare = ownerShare;
      updateData.adminShare = adminShare;
    }

    // Handle uploaded photos
    const billDocPhoto    = fileUrl(req.files, 'billDocPhoto');
    const tazkiraDocPhoto = fileUrl(req.files, 'tazkiraDocPhoto');
    if (billDocPhoto)    updateData.billDocPhoto    = billDocPhoto;
    if (tazkiraDocPhoto) updateData.tazkiraDocPhoto = tazkiraDocPhoto;

    // Fetch existing contract once for car-swap and advance recalc
    const existing = await prisma.rentalContract.findUnique({
      where: { id: req.params.id },
      select: { carId: true, totalRent: true },
    });
    if (!existing) return sendError(res, 'سفارش یافت نشد', 404);

    // Swap car status when carId changes
    if (updateData.carId && updateData.carId !== existing.carId) {
      await prisma.car.update({ where: { id: existing.carId },       data: { status: 'AVAILABLE' } }).catch(() => {});
      await prisma.car.update({ where: { id: updateData.carId },     data: { status: 'RENTED'    } }).catch(() => {});
    }

    // Recalculate remainingAmount if advancePayment changes without a new totalRent
    if (updateData.advancePayment !== undefined && updateData.totalRent === undefined) {
      const advance = parseFloat(String(updateData.advancePayment)) || 0;
      updateData.remainingAmount = Math.max(0, existing.totalRent - advance);
    }

    const contract = await prisma.rentalContract.update({
      where: { id: req.params.id },
      data: updateData,
      include: { car: true, customer: true, guarantor: true },
    });
    sendSuccess(res, contract, 'سفارش موفقانه بروز شد');
  } catch (err) { sendError(res, err.message); }
};

export const markAsReturned = async (req, res) => {
  try {
    const contract = await prisma.rentalContract.update({
      where: { id: req.params.id },
      data: { status: 'COMPLETED' },
      include: { car: true },
    });
    await prisma.car.update({ where: { id: contract.carId }, data: { status: 'AVAILABLE' } });
    sendSuccess(res, contract, 'موتر موفقانه برگشت داده شد');
  } catch (err) { sendError(res, err.message); }
};

export const addPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, paymentMethod, notes } = req.body;
    const payment = await prisma.payment.create({
      data: { contractId: id, amount: parseFloat(amount), paymentMethod, notes },
    });
    const [totalPaidResult, contract] = await Promise.all([
      prisma.payment.aggregate({ _sum: { amount: true }, where: { contractId: id } }),
      prisma.rentalContract.findUnique({ where: { id }, select: { totalRent: true } }),
    ]);
    const totalPaid = totalPaidResult._sum.amount || 0;
    const remaining = (contract?.totalRent || 0) - totalPaid;
    await prisma.rentalContract.update({
      where: { id },
      data: { remainingAmount: Math.max(0, remaining) },
    });
    sendSuccess(res, payment, 'پرداخت موفقانه ثبت شد', 201);
  } catch (err) { sendError(res, err.message); }
};

export const deleteContract = async (req, res) => {
  try {
    const contract = await prisma.rentalContract.findUnique({ where: { id: req.params.id } });
    if (!contract) return sendError(res, 'سفارش یافت نشد', 404);

    await prisma.payment.deleteMany({ where: { contractId: req.params.id } });
    await prisma.rentalContract.delete({ where: { id: req.params.id } });

    // Delete contract document files
    deleteUploadedFiles(contract.billDocPhoto, contract.tazkiraDocPhoto);

    // Restore car to available
    await prisma.car.update({ where: { id: contract.carId }, data: { status: 'AVAILABLE' } }).catch(() => {});

    // Delete customer only if they have no other contracts
    const remainingContracts = await prisma.rentalContract.count({
      where: { customerId: contract.customerId },
    });
    if (remainingContracts === 0) {
      const customer = await prisma.customer.findUnique({ where: { id: contract.customerId }, select: { photo: true } }).catch(() => null);
      await prisma.customer.delete({ where: { id: contract.customerId } }).catch(() => {});
      if (customer?.photo) deleteUploadedFiles(customer.photo);
    }

    sendSuccess(res, null, 'سفارش موفقانه حذف شد');
  } catch (err) { sendError(res, err.message); }
};
