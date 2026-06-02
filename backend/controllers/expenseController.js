import prisma from "../utils/prisma.js";
import { sendSuccess, sendError } from "../utils/response.js";
import { getFileUrl } from "../utils/storage.js";
import {
  getKabulMonthRangeForDate,
  parseKabulFilterRange,
  parseKabulDateString,
} from "../utils/dateUtils.js";

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
  return getKabulMonthRangeForDate();
}

/** Calculate 50/50 split — returns { adminShare, ownerShare } */
function calcSplit(amount) {
  const adminShare = Math.round(amount * 0.5 * 100) / 100;
  const ownerShare = Math.round((amount - adminShare) * 100) / 100;
  return { adminShare, ownerShare };
}

// ── controllers ───────────────────────────────────────────────────────────────

export const getExpenseStats = async (req, res) => {
  try {
    const isOwner = req.owner !== undefined;
    const ownerId = isOwner ? req.owner.id : null;

    const ownerCarFilter = ownerId ? { car: { ownerId } } : {};

    const [today, week, month, total, totalSplits] = await Promise.all([
      prisma.expense.aggregate({
        where: { date: dayRange(), ...ownerCarFilter },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.expense.aggregate({
        where: { date: weekRange(), ...ownerCarFilter },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.expense.aggregate({
        where: { date: monthRange(), ...ownerCarFilter },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.expense.aggregate({
        where: { ...ownerCarFilter },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.expense.aggregate({
        where: { ...ownerCarFilter },
        _sum: { amount: true, adminShare: true, ownerShare: true },
      }),
    ]);

    sendSuccess(res, {
      today: { amount: today._sum.amount || 0, count: today._count },
      week: { amount: week._sum.amount || 0, count: week._count },
      month: { amount: month._sum.amount || 0, count: month._count },
      total: { amount: total._sum.amount || 0, count: total._count },
      splits: {
        totalAdminShare: totalSplits._sum.adminShare || 0,
        totalOwnerShare: totalSplits._sum.ownerShare || 0,
      },
    });
  } catch (err) {
    sendError(res, err.message);
  }
};

export const getExpenses = async (req, res) => {
  try {
    const isOwner = req.owner !== undefined;
    const ownerId = isOwner ? req.owner.id : null;

    const {
      search,
      dateFrom,
      dateTo,
      page = 1,
      limit = 20,
      sortBy = "date",
      sortDir = "desc",
    } = req.query;

    const where = {};

    if (ownerId) where.car = { ownerId };

    if (dateFrom || dateTo) {
      const range = parseKabulFilterRange({ dateFrom, dateTo });
      if (range.gte || range.lte) where.date = range;
    }

    if (search) {
      where.OR = [
        { fromWhom: { contains: search, mode: "insensitive" } },
        { toWhom: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { createdBy: { contains: search, mode: "insensitive" } },
      ];
    }

    const validSort = ["date", "amount", "createdAt", "fromWhom", "toWhom"];
    const orderField = validSort.includes(sortBy) ? sortBy : "date";
    const orderDir = sortDir === "asc" ? "asc" : "desc";

    const skip = (Number(page) - 1) * Number(limit);

    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        orderBy: { [orderField]: orderDir },
        skip,
        take: Number(limit),
        include: {
          car: {
            select: {
              id: true,
              carName: true,
              plateNumber: true,
              ownerId: true,
              owner: { select: { id: true, fullName: true } },
            },
          },
        },
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
  } catch (err) {
    sendError(res, err.message);
  }
};

export const getExpenseById = async (req, res) => {
  try {
    const expense = await prisma.expense.findUnique({
      where: { id: req.params.id },
      include: {
        car: {
          select: {
            id: true,
            carName: true,
            plateNumber: true,
            ownerId: true,
            owner: { select: { id: true, fullName: true } },
          },
        },
      },
    });
    if (!expense) return sendError(res, "مصرف یافت نشد", 404);

    if (req.owner && expense.car?.ownerId !== req.owner.id) {
      return sendError(res, "دسترسی غیرمجاز", 403);
    }

    sendSuccess(res, expense);
  } catch (err) {
    sendError(res, err.message);
  }
};

export const createExpense = async (req, res) => {
  try {
    const { fromWhom, toWhom, amount, date, description, carId } = req.body;

    if (!fromWhom?.trim() || !toWhom?.trim() || !amount || !date) {
      return sendError(res, "فیلدهای الزامی را پر کنید", 400);
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return sendError(res, "مقدار پول باید عدد مثبت باشد", 400);
    }

    // Fetch car with owner when provided
    let car = null;
    if (carId) {
      car = await prisma.car.findUnique({
        where: { id: carId },
        include: {
          owner: { select: { id: true, fullName: true, phoneNumber: true } },
        },
      });
      if (!car) return sendError(res, "موتر یافت نشد", 404);
    }

    // Calculate 50/50 split — only applies when a car is linked
    const { adminShare, ownerShare } = carId
      ? calcSplit(parsedAmount)
      : { adminShare: parsedAmount, ownerShare: 0 };

    const createdBy = req.user?.name || req.user?.email || "مدیر سیستم";

    const receiptPhoto = getFileUrl(req.file, "expenses") ?? null;

    const expense = await prisma.expense.create({
      data: {
        fromWhom: fromWhom.trim(),
        toWhom: toWhom.trim(),
        amount: parsedAmount,
        adminShare,
        ownerShare,
        date: parseKabulDateString(date),
        description: description?.trim() || null,
        carId: carId || null,
        createdBy,
        ...(receiptPhoto && { receiptPhoto }),
      },
      include: {
        car: {
          select: {
            id: true,
            carName: true,
            plateNumber: true,
            ownerId: true,
            owner: { select: { id: true, fullName: true } },
          },
        },
      },
    });

    // Create owner notification if the car has an owner
    if (car?.owner?.id && ownerShare > 0) {
      const dateStr = new Intl.DateTimeFormat("fa-AF-u-ca-persian-nu-latn", {
        timeZone: "Asia/Kabul",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(parseKabulDateString(date) || new Date(date));
      await prisma.ownerNotification.create({
        data: {
          ownerId: car.owner.id,
          title: "کسر مصرف از حساب شما",
          message:
            `مصرف جدید برای موتر ${car.carName} (${car.plateNumber}) ثبت شد.\n` +
            `مجموع مصرف: ${parsedAmount.toLocaleString("en-US")} افغانی\n` +
            `سهم شما (۵۰٪): ${ownerShare.toLocaleString("en-US")} افغانی از حساب شما کسر گردید\n` +
            `سهم ادمین (۵۰٪): ${adminShare.toLocaleString("en-US")} افغانی\n` +
            `${description ? "توضیحات: " + description.trim() + "\n" : ""}` +
            `تاریخ: ${dateStr} | ثبت‌کننده: ${createdBy}`,
          type: "EXPENSE",
          carId: carId || null,
          expenseId: expense.id,
          amount: ownerShare,
        },
      });
    }

    sendSuccess(res, expense, "مصرف موفقانه ثبت شد", 201);
  } catch (err) {
    sendError(res, err.message);
  }
};

export const updateExpense = async (req, res) => {
  try {
    const existing = await prisma.expense.findUnique({
      where: { id: req.params.id },
    });
    if (!existing) return sendError(res, "مصرف یافت نشد", 404);

    const { fromWhom, toWhom, amount, date, description, carId } = req.body;

    if (!fromWhom?.trim() || !toWhom?.trim() || !amount || !date) {
      return sendError(res, "فیلدهای الزامی را پر کنید", 400);
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return sendError(res, "مقدار پول باید عدد مثبت باشد", 400);
    }

    if (carId) {
      const car = await prisma.car.findUnique({ where: { id: carId } });
      if (!car) return sendError(res, "موتر یافت نشد", 404);
    }

    const { adminShare, ownerShare } = carId
      ? calcSplit(parsedAmount)
      : { adminShare: parsedAmount, ownerShare: 0 };

    const receiptPhoto = getFileUrl(req.file, "expenses");

    const expense = await prisma.expense.update({
      where: { id: req.params.id },
      data: {
        fromWhom: fromWhom.trim(),
        toWhom: toWhom.trim(),
        amount: parsedAmount,
        adminShare,
        ownerShare,
        date: new Date(date),
        description: description?.trim() || null,
        carId: carId || null,
        ...(receiptPhoto !== undefined && { receiptPhoto }),
      },
      include: {
        car: {
          select: {
            id: true,
            carName: true,
            plateNumber: true,
            ownerId: true,
            owner: { select: { id: true, fullName: true } },
          },
        },
      },
    });

    sendSuccess(res, expense, "مصرف موفقانه بروز شد");
  } catch (err) {
    sendError(res, err.message);
  }
};

export const deleteExpense = async (req, res) => {
  try {
    const existing = await prisma.expense.findUnique({
      where: { id: req.params.id },
    });
    if (!existing) return sendError(res, "مصرف یافت نشد", 404);
    await prisma.expense.delete({ where: { id: req.params.id } });
    sendSuccess(res, null, "مصرف موفقانه حذف شد");
  } catch (err) {
    sendError(res, err.message);
  }
};
