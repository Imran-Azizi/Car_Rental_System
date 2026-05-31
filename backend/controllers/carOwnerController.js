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

async function generateOwnerPaymentReceiptNumber() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const prefix = `OWN-${year}${month}${day}`;

  const count = await prisma.carOwnerPayment.count({
    where: { receiptNumber: { startsWith: prefix } },
  });

  return `${prefix}-${String(count + 1).padStart(4, '0')}`;
}

function parsePositiveAmount(amount) {
  if (amount === undefined || amount === null || amount === '') return null;
  const parsed = parseFloat(amount);
  if (Number.isNaN(parsed) || parsed <= 0) return null;
  return parsed;
}

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
      include: {
        _count: { select: { cars: true, payments: true } },
        payments: { select: { amount: true } },
      },
    });
    sendSuccess(res, owners.map(owner => {
      const totalPaid = owner.payments.reduce((sum, payment) => sum + payment.amount, 0);
      const { payments, ...rest } = owner;
      return sanitize({ ...rest, totalPaid });
    }));
  } catch (err) { sendError(res, err.message); }
};

export const getCarOwnerById = async (req, res) => {
  try {
    const owner = await prisma.carOwner.findUnique({
      where: { id: req.params.id },
      include: {
        cars: true,
        payments: { orderBy: { paymentDate: 'desc' } },
      },
    });
    if (!owner) return sendError(res, 'صاحب موتر یافت نشد', 404);
    const totalPaid = owner.payments.reduce((sum, payment) => sum + payment.amount, 0);
    sendSuccess(res, sanitize({ ...owner, totalPaid }));
  } catch (err) { sendError(res, err.message); }
};

export const getCarOwnerPaymentStats = async (req, res) => {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const [allTime, thisMonth] = await Promise.all([
      prisma.carOwnerPayment.aggregate({ _sum: { amount: true }, _count: true }),
      prisma.carOwnerPayment.aggregate({
        where: { paymentDate: { gte: monthStart, lte: monthEnd } },
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    sendSuccess(res, {
      allTime: { amount: allTime._sum.amount || 0, count: allTime._count },
      thisMonth: { amount: thisMonth._sum.amount || 0, count: thisMonth._count },
    });
  } catch (err) { sendError(res, err.message); }
};

export const getNextCarOwnerPaymentReceiptNumber = async (req, res) => {
  try {
    sendSuccess(res, { receiptNumber: await generateOwnerPaymentReceiptNumber() });
  } catch (err) { sendError(res, err.message); }
};

export const getCarOwnerPayments = async (req, res) => {
  try {
    const { ownerId, search, dateFrom, dateTo, page = 1, limit = 50 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const where = {};

    if (ownerId) where.ownerId = ownerId;
    if (search) {
      where.OR = [
        { receiptNumber: { contains: search, mode: 'insensitive' } },
        { paymentMethod: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
        { createdBy: { contains: search, mode: 'insensitive' } },
        { owner: { fullName: { contains: search, mode: 'insensitive' } } },
        { owner: { phoneNumber: { contains: search, mode: 'insensitive' } } },
      ];
    }
    if (dateFrom || dateTo) {
      where.paymentDate = {};
      if (dateFrom) where.paymentDate.gte = new Date(dateFrom);
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        where.paymentDate.lte = end;
      }
    }

    const [payments, total] = await Promise.all([
      prisma.carOwnerPayment.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { paymentDate: 'desc' },
        include: {
          owner: {
            select: {
              id: true,
              fullName: true,
              fatherName: true,
              tazkiraNumber: true,
              phoneNumber: true,
              address: true,
            },
          },
        },
      }),
      prisma.carOwnerPayment.count({ where }),
    ]);

    sendSuccess(res, {
      payments,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err) { sendError(res, err.message); }
};

export const getCarOwnerPaymentById = async (req, res) => {
  try {
    const payment = await prisma.carOwnerPayment.findUnique({
      where: { id: req.params.id },
      include: { owner: true },
    });
    if (!payment) return sendError(res, 'رسید پرداخت یافت نشد', 404);
    sendSuccess(res, payment);
  } catch (err) { sendError(res, err.message); }
};

export const createCarOwnerPayment = async (req, res) => {
  try {
    const { ownerId, amount, paymentDate, paymentMethod, notes } = req.body;

    if (!ownerId) return sendError(res, 'صاحب موتر الزامی است', 400);
    if (!paymentDate) return sendError(res, 'تاریخ پرداخت الزامی است', 400);

    const parsedAmount = parsePositiveAmount(amount);
    if (!parsedAmount) return sendError(res, 'مقدار پرداخت باید عدد مثبت باشد', 400);

    const owner = await prisma.carOwner.findUnique({ where: { id: ownerId } });
    if (!owner) return sendError(res, 'صاحب موتر یافت نشد', 404);

    const createdBy = req.user?.name || req.user?.email || 'مدیر سیستم';
    let lastError;

    for (let attempt = 0; attempt < 3; attempt += 1) {
      const receiptNumber = await generateOwnerPaymentReceiptNumber();
      try {
        const payment = await prisma.carOwnerPayment.create({
          data: {
            ownerId,
            amount: parsedAmount,
            paymentDate: new Date(paymentDate),
            paymentMethod: paymentMethod?.trim() || null,
            notes: notes?.trim() || null,
            receiptNumber,
            createdBy,
          },
          include: {
            owner: {
              select: {
                id: true,
                fullName: true,
                fatherName: true,
                tazkiraNumber: true,
                phoneNumber: true,
                address: true,
              },
            },
          },
        });
        return sendSuccess(res, payment, 'رسید پول موفقانه ثبت شد', 201);
      } catch (err) {
        lastError = err;
        if (err.code !== 'P2002') break;
      }
    }

    sendError(res, lastError?.message || 'شماره رسید تکراری است', 400);
  } catch (err) { sendError(res, err.message); }
};

export const updateCarOwnerPayment = async (req, res) => {
  try {
    const existing = await prisma.carOwnerPayment.findUnique({ where: { id: req.params.id } });
    if (!existing) return sendError(res, 'رسید پرداخت یافت نشد', 404);

    const { amount, paymentDate, paymentMethod, notes } = req.body;
    if (!paymentDate) return sendError(res, 'تاریخ پرداخت الزامی است', 400);

    const parsedAmount = parsePositiveAmount(amount);
    if (!parsedAmount) return sendError(res, 'مقدار پرداخت باید عدد مثبت باشد', 400);

    const payment = await prisma.carOwnerPayment.update({
      where: { id: req.params.id },
      data: {
        amount: parsedAmount,
        paymentDate: new Date(paymentDate),
        paymentMethod: paymentMethod?.trim() || null,
        notes: notes?.trim() || null,
      },
      include: {
        owner: {
          select: {
            id: true,
            fullName: true,
            fatherName: true,
            tazkiraNumber: true,
            phoneNumber: true,
            address: true,
          },
        },
      },
    });

    sendSuccess(res, payment, 'رسید پول موفقانه بروزرسانی شد');
  } catch (err) { sendError(res, err.message); }
};

export const deleteCarOwnerPayment = async (req, res) => {
  try {
    const existing = await prisma.carOwnerPayment.findUnique({ where: { id: req.params.id } });
    if (!existing) return sendError(res, 'رسید پرداخت یافت نشد', 404);
    await prisma.carOwnerPayment.delete({ where: { id: req.params.id } });
    sendSuccess(res, null, 'رسید پرداخت حذف شد');
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
