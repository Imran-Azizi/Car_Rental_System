import prisma from '../utils/prisma.js';
import { sendSuccess, sendError } from '../utils/response.js';

// ── helpers ──────────────────────────────────────────────────────────────────

function dayRange(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  d.setHours(0, 0, 0, 0);
  const end = new Date(d);
  end.setHours(23, 59, 59, 999);
  return { gte: d, lte: end };
}

function weekRange() {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay());
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { gte: start, lte: end };
}

function monthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  return { gte: start, lte: end };
}

// ── controllers ───────────────────────────────────────────────────────────────

export const getExpenseStats = async (req, res) => {
  try {
    const isOwner = req.owner !== undefined;
    const ownerId = isOwner ? req.owner.id : null;

    const ownerCarFilter = ownerId
      ? { car: { ownerId } }
      : {};

    const [today, week, month, total] = await Promise.all([
      prisma.expense.aggregate({ where: { date: dayRange(), ...ownerCarFilter }, _sum: { amount: true }, _count: true }),
      prisma.expense.aggregate({ where: { date: weekRange(), ...ownerCarFilter }, _sum: { amount: true }, _count: true }),
      prisma.expense.aggregate({ where: { date: monthRange(), ...ownerCarFilter }, _sum: { amount: true }, _count: true }),
      prisma.expense.aggregate({ where: { ...ownerCarFilter }, _sum: { amount: true }, _count: true }),
    ]);

    sendSuccess(res, {
      today:  { amount: today._sum.amount  || 0, count: today._count  },
      week:   { amount: week._sum.amount   || 0, count: week._count   },
      month:  { amount: month._sum.amount  || 0, count: month._count  },
      total:  { amount: total._sum.amount  || 0, count: total._count  },
    });
  } catch (err) { sendError(res, err.message); }
};

export const getExpenses = async (req, res) => {
  try {
    const isOwner = req.owner !== undefined;
    const ownerId = isOwner ? req.owner.id : null;

    const { search, dateFrom, dateTo, page = 1, limit = 20, sortBy = 'date', sortDir = 'desc' } = req.query;

    const where = {};

    // Car owner scoping
    if (ownerId) {
      where.car = { ownerId };
    }

    // Date range
    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) where.date.gte = new Date(dateFrom);
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        where.date.lte = end;
      }
    }

    // Search
    if (search) {
      where.OR = [
        { fromWhom:    { contains: search, mode: 'insensitive' } },
        { toWhom:      { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { createdBy:   { contains: search, mode: 'insensitive' } },
      ];
    }

    const validSort = ['date', 'amount', 'createdAt', 'fromWhom', 'toWhom'];
    const orderField = validSort.includes(sortBy) ? sortBy : 'date';
    const orderDir   = sortDir === 'asc' ? 'asc' : 'desc';

    const skip = (Number(page) - 1) * Number(limit);

    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        orderBy: { [orderField]: orderDir },
        skip,
        take: Number(limit),
        include: { car: { select: { id: true, carName: true, plateNumber: true, ownerId: true } } },
      }),
      prisma.expense.count({ where }),
    ]);

    sendSuccess(res, {
      expenses,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err) { sendError(res, err.message); }
};

export const getExpenseById = async (req, res) => {
  try {
    const expense = await prisma.expense.findUnique({
      where: { id: req.params.id },
      include: { car: { select: { id: true, carName: true, plateNumber: true, ownerId: true } } },
    });
    if (!expense) return sendError(res, 'مصرف یافت نشد', 404);

    // Owner can only view expenses linked to their cars
    if (req.owner && expense.car?.ownerId !== req.owner.id) {
      return sendError(res, 'دسترسی غیرمجاز', 403);
    }

    sendSuccess(res, expense);
  } catch (err) { sendError(res, err.message); }
};

export const createExpense = async (req, res) => {
  try {
    const { fromWhom, toWhom, amount, date, description, carId } = req.body;

    if (!fromWhom?.trim() || !toWhom?.trim() || !amount || !date) {
      return sendError(res, 'فیلدهای الزامی را پر کنید', 400);
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return sendError(res, 'مقدار پول باید عدد مثبت باشد', 400);
    }

    // Verify car exists if provided
    if (carId) {
      const car = await prisma.car.findUnique({ where: { id: carId } });
      if (!car) return sendError(res, 'موتر یافت نشد', 404);
    }

    const createdBy = req.user?.name || req.user?.email || 'مدیر سیستم';

    const expense = await prisma.expense.create({
      data: {
        fromWhom: fromWhom.trim(),
        toWhom: toWhom.trim(),
        amount: parsedAmount,
        date: new Date(date),
        description: description?.trim() || null,
        carId: carId || null,
        createdBy,
      },
      include: { car: { select: { id: true, carName: true, plateNumber: true } } },
    });

    sendSuccess(res, expense, 'مصرف موفقانه ثبت شد', 201);
  } catch (err) { sendError(res, err.message); }
};

export const updateExpense = async (req, res) => {
  try {
    const existing = await prisma.expense.findUnique({ where: { id: req.params.id } });
    if (!existing) return sendError(res, 'مصرف یافت نشد', 404);

    const { fromWhom, toWhom, amount, date, description, carId } = req.body;

    if (!fromWhom?.trim() || !toWhom?.trim() || !amount || !date) {
      return sendError(res, 'فیلدهای الزامی را پر کنید', 400);
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return sendError(res, 'مقدار پول باید عدد مثبت باشد', 400);
    }

    if (carId) {
      const car = await prisma.car.findUnique({ where: { id: carId } });
      if (!car) return sendError(res, 'موتر یافت نشد', 404);
    }

    const expense = await prisma.expense.update({
      where: { id: req.params.id },
      data: {
        fromWhom: fromWhom.trim(),
        toWhom: toWhom.trim(),
        amount: parsedAmount,
        date: new Date(date),
        description: description?.trim() || null,
        carId: carId || null,
      },
      include: { car: { select: { id: true, carName: true, plateNumber: true } } },
    });

    sendSuccess(res, expense, 'مصرف موفقانه بروز شد');
  } catch (err) { sendError(res, err.message); }
};

export const deleteExpense = async (req, res) => {
  try {
    const existing = await prisma.expense.findUnique({ where: { id: req.params.id } });
    if (!existing) return sendError(res, 'مصرف یافت نشد', 404);
    await prisma.expense.delete({ where: { id: req.params.id } });
    sendSuccess(res, null, 'مصرف موفقانه حذف شد');
  } catch (err) { sendError(res, err.message); }
};
