import prisma from '../utils/prisma.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { generateContractNumber } from '../utils/generateContractNumber.js';
import { deleteUploadedFiles } from '../utils/fileUtils.js';
import { enrichWithOverdue, calcLiveOverdue, buildDeadline } from '../utils/overdueUtils.js';
import { getFieldUrl } from '../utils/storage.js';

// Profit-sharing ratio — owner gets 50%, admin keeps 50%
const OWNER_SHARE_PCT = parseFloat(process.env.OWNER_SHARE_PCT || '0.50');

// Simple YYYY-MM-DD formatter used in notification messages
const fmtDate = d => {
  const dt = new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
};

function calcShares(totalRent) {
  const total = parseFloat(totalRent) || 0;
  const ownerShare = Math.round(total * OWNER_SHARE_PCT * 100) / 100;
  const adminShare = Math.round((total - ownerShare) * 100) / 100;
  return { ownerShare, adminShare };
}

/** Extract uploaded file URL or return undefined (works for local disk and Cloudinary) */
const fileUrl = (files, field) => getFieldUrl(files, field, 'contracts');

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
    sendSuccess(res, contracts.map(enrichWithOverdue));
  } catch (err) { sendError(res, err.message); }
};

export const getContractById = async (req, res) => {
  try {
    const contract = await prisma.rentalContract.findUnique({
      where: { id: req.params.id },
      include: { car: true, customer: true, guarantor: true, payments: { orderBy: { createdAt: 'desc' } } },
    });
    if (!contract) return sendError(res, 'قرارداد یافت نشد', 404);
    sendSuccess(res, enrichWithOverdue(contract));
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

    const billDocPhoto     = fileUrl(req.files, 'billDocPhoto');
    const tazkiraDocPhoto  = fileUrl(req.files, 'tazkiraDocPhoto');
    const tazkiraDocPhoto2 = fileUrl(req.files, 'tazkiraDocPhoto2');

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
      ...(req.body.driverName    && { driverName:    req.body.driverName }),
      ...(req.body.driverLicense && { driverLicense: req.body.driverLicense }),
      ...(req.body.driverPhone   && { driverPhone:   req.body.driverPhone }),
      ...(billDocPhoto     !== undefined && { billDocPhoto }),
      ...(tazkiraDocPhoto  !== undefined && { tazkiraDocPhoto }),
      ...(tazkiraDocPhoto2 !== undefined && { tazkiraDocPhoto2 }),
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

    // Notify car owner: booking created
    const ownerId = contract.car?.ownerId;
    if (ownerId) {
      prisma.ownerNotification.create({
        data: {
          ownerId,
          title:   'موتر شما کرایه داده شد',
          message: [
            `موتر ${contract.car.carName} برای دوره زیر به کرایه داده شد:`,
            `از تاریخ: ${fmtDate(data.startDate)}`,
            `تا تاریخ: ${fmtDate(data.endDate)}`,
            `شماره سفارش: ${contractNumber}`,
            `جزئیات مالی پس از برگشت موتر نمایش داده خواهد شد.`,
          ].join('\n'),
          type:  'BOOKING',
          carId: data.carId,
        },
      }).catch(() => {});
    }

    sendSuccess(res, contract, 'سفارش موفقانه ثبت شد', 201);
  } catch (err) { sendError(res, err.message); }
};

export const updateContract = async (req, res) => {
  try {
    /* ── 24-hour edit window guard for COMPLETED orders ── */
    const current = await prisma.rentalContract.findUnique({
      where:  { id: req.params.id },
      select: { status: true, completedAt: true },
    });
    if (!current) return sendError(res, 'سفارش یافت نشد', 404);

    if (current.status === 'COMPLETED' && current.completedAt) {
      const elapsedHours = (Date.now() - new Date(current.completedAt).getTime()) / 3_600_000;
      if (elapsedHours > 24) {
        return sendError(
          res,
          'ویرایش سفارش‌های تکمیل‌شده فقط تا ۲۴ ساعت پس از تکمیل مجاز است.',
          403,
        );
      }
    }

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

    // Recalculate shares AND remaining when totalRent changes
    if (updateData.totalRent !== undefined) {
      const newTotal = parseFloat(String(updateData.totalRent)) || 0;

      if (newTotal < 0) return sendError(res, 'مجموع کرایه نمی‌تواند منفی باشد', 400);

      const { ownerShare, adminShare } = calcShares(newTotal);
      updateData.ownerShare = ownerShare;
      updateData.adminShare = adminShare;

      // Recalculate remaining = newTotal - sum(all payments for this contract)
      const paidAgg = await prisma.payment.aggregate({
        _sum: { amount: true },
        where: { contractId: req.params.id },
      });
      const totalPaid = paidAgg._sum.amount || 0;
      updateData.remainingAmount = Math.max(0, newTotal - totalPaid);
    }

    // Handle uploaded photos
    const billDocPhoto     = fileUrl(req.files, 'billDocPhoto');
    const tazkiraDocPhoto  = fileUrl(req.files, 'tazkiraDocPhoto');
    const tazkiraDocPhoto2 = fileUrl(req.files, 'tazkiraDocPhoto2');
    if (billDocPhoto)     updateData.billDocPhoto     = billDocPhoto;
    if (tazkiraDocPhoto)  updateData.tazkiraDocPhoto  = tazkiraDocPhoto;
    if (tazkiraDocPhoto2) updateData.tazkiraDocPhoto2 = tazkiraDocPhoto2;

    // Fetch existing contract once for car-swap and advance recalc
    // (reuse 'current' from the guard above for carId + totalRent)
    const existing = await prisma.rentalContract.findUnique({
      where: { id: req.params.id },
      select: { carId: true, totalRent: true },
    });
    if (!existing) return sendError(res, 'سفارش یافت نشد', 404); // safety fallback

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
    // Freeze the live overdue charges before completing the contract
    const existing = await prisma.rentalContract.findUnique({
      where: { id: req.params.id },
      select: { endDate: true, endTime: true, rentPrice: true },
    });
    const { overdueCharges: frozenCharges } = existing
      ? calcLiveOverdue(existing.endDate, existing.endTime, existing.rentPrice)
      : { overdueCharges: 0 };

    const contract = await prisma.rentalContract.update({
      where: { id: req.params.id },
      data: { status: 'COMPLETED', overdueCharges: frozenCharges, completedAt: new Date() },
      include: { car: true },
    });
    await prisma.car.update({ where: { id: contract.carId }, data: { status: 'AVAILABLE' } });

    // Notify car owner: car returned, full details now visible
    const ownerId = contract.car?.ownerId;
    if (ownerId) {
      prisma.ownerNotification.create({
        data: {
          ownerId,
          title:   'موتر برگشت داده شد — اطلاعات کامل قابل مشاهده',
          message: [
            `موتر ${contract.car.carName} برگشت داده شد.`,
            `شماره قرارداد: ${contract.contractNumber}`,
            `سهم شما از این قرارداد: ${contract.ownerShare || 0} افغانی`,
            `اکنون می‌توانید تمام جزئیات مالی و اطلاعات قرارداد را در پنل خود مشاهده کنید.`,
          ].join('\n'),
          type:   'RETURN',
          carId:  contract.carId,
          amount: contract.ownerShare || 0,
        },
      }).catch(() => {});
    }

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
    const totalPaid     = totalPaidResult._sum.amount || 0;
    const remaining     = Math.max(0, (contract?.totalRent || 0) - totalPaid);
    await prisma.rentalContract.update({
      where: { id },
      data: { remainingAmount: remaining },
    });
    /* Return the new remainingAmount so the frontend can decide
       whether to automatically mark the order as returned. */
    sendSuccess(res, { payment, remainingAmount: remaining }, 'پرداخت موفقانه ثبت شد', 201);
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

/**
 * Auto-mark ACTIVE contracts as OVERDUE when their deadline has passed.
 * Called by the background job in server.js every 30 minutes.
 * Returns the number of contracts marked.
 */
export const autoMarkOverdue = async () => {
  try {
    // Fetch all ACTIVE contracts past their endDate
    const candidates = await prisma.rentalContract.findMany({
      where: {
        status: 'ACTIVE',
        endDate: { lt: new Date() }, // endDate is before now
      },
      select: { id: true, endDate: true, endTime: true, rentPrice: true },
    });

    const toMark = candidates.filter(c => {
      const deadline = buildDeadline(c.endDate, c.endTime);
      return new Date() > deadline;
    });

    if (toMark.length === 0) return 0;

    await prisma.rentalContract.updateMany({
      where: { id: { in: toMark.map(c => c.id) } },
      data: { status: 'OVERDUE' },
    });

    return toMark.length;
  } catch (err) {
    console.error('[autoMarkOverdue] error:', err.message);
    return 0;
  }
};

/** Route handler wrapper for manual trigger or health checks */
export const triggerOverdueCheck = async (req, res) => {
  const count = await autoMarkOverdue();
  sendSuccess(res, { marked: count }, `${count} سفارش به ناوقت تبدیل شد`);
};
