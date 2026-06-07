import prisma from '../utils/prisma.js';
import { sendSuccess, sendError } from '../utils/response.js';
import {
  getKabulMonthRangeForDate,
  parseKabulFilterRange,
  parseKabulDateString,
} from '../utils/dateUtils.js';

// ── Receipt number generator ──────────────────────────────────────────────────

async function generateReceiptNumber() {
  const now   = new Date();
  const year  = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day   = String(now.getDate()).padStart(2, '0');
  const prefix = `SAL-${year}${month}${day}`;

  const count = await prisma.salaryPayment.count({
    where: { receiptNumber: { startsWith: prefix } },
  });
  return `${prefix}-${String(count + 1).padStart(4, '0')}`;
}

// ── Employee CRUD ─────────────────────────────────────────────────────────────

export const getEmployees = async (req, res) => {
  try {
    const { search, page = 1, limit = 50 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where = search
      ? {
          OR: [
            { fullName:        { contains: search, mode: 'insensitive' } },
            { fatherName:      { contains: search, mode: 'insensitive' } },
            { grandfatherName: { contains: search, mode: 'insensitive' } },
            { tazkiraNumber:   { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};

    const [employees, total] = await Promise.all([
      prisma.employee.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { salaryPayments: true } },
          salaryPayments: { select: { amount: true } },
        },
      }),
      prisma.employee.count({ where }),
    ]);

    const mapped = employees.map(e => {
      const totalPaid = e.salaryPayments.reduce((s, p) => s + p.amount, 0);
      const { salaryPayments, ...rest } = e;
      return { ...rest, totalPaid };
    });

    sendSuccess(res, {
      employees: mapped,
      pagination: {
        total,
        page:       Number(page),
        limit:      Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err) { sendError(res, err.message); }
};

export const getEmployeeById = async (req, res) => {
  try {
    const employee = await prisma.employee.findUnique({
      where: { id: req.params.id },
      include: {
        salaryPayments: { orderBy: { paymentDate: 'desc' } },
      },
    });
    if (!employee) return sendError(res, 'کارمند یافت نشد', 404);

    const totalPaid = employee.salaryPayments.reduce((s, p) => s + p.amount, 0);
    sendSuccess(res, { ...employee, totalPaid });
  } catch (err) { sendError(res, err.message); }
};

export const createEmployee = async (req, res) => {
  try {
    const { fullName, fatherName, grandfatherName, tazkiraNumber, baseSalary } = req.body;

    if (!fullName?.trim())      return sendError(res, 'نام الزامی است', 400);
    if (!fatherName?.trim())    return sendError(res, 'نام پدر الزامی است', 400);
    if (!tazkiraNumber?.trim()) return sendError(res, 'نمبر تذکره الزامی است', 400);
    if (!baseSalary)            return sendError(res, 'مقدار پول الزامی است', 400);

    const parsed = parseFloat(baseSalary);
    if (isNaN(parsed) || parsed < 0) return sendError(res, 'مقدار پول باید عدد مثبت باشد', 400);

    const exists = await prisma.employee.findUnique({ where: { tazkiraNumber: tazkiraNumber.trim() } });
    if (exists) return sendError(res, 'نمبر تذکره قبلاً ثبت شده است', 409);

    const employee = await prisma.employee.create({
      data: {
        fullName:        fullName.trim(),
        fatherName:      fatherName.trim(),
        grandfatherName: grandfatherName?.trim() || null,
        tazkiraNumber:   tazkiraNumber.trim(),
        baseSalary:      parsed,
      },
    });

    sendSuccess(res, employee, 'کارمند موفقانه ثبت شد', 201);
  } catch (err) { sendError(res, err.message); }
};

export const updateEmployee = async (req, res) => {
  try {
    const existing = await prisma.employee.findUnique({ where: { id: req.params.id } });
    if (!existing) return sendError(res, 'کارمند یافت نشد', 404);

    const { fullName, fatherName, grandfatherName, tazkiraNumber, baseSalary } = req.body;

    if (!fullName?.trim())      return sendError(res, 'نام الزامی است', 400);
    if (!fatherName?.trim())    return sendError(res, 'نام پدر الزامی است', 400);
    if (!tazkiraNumber?.trim()) return sendError(res, 'نمبر تذکره الزامی است', 400);
    if (!baseSalary)            return sendError(res, 'مقدار پول الزامی است', 400);

    const parsed = parseFloat(baseSalary);
    if (isNaN(parsed) || parsed < 0) return sendError(res, 'مقدار پول باید عدد مثبت باشد', 400);

    // Check uniqueness for tazkira (exclude self)
    const dup = await prisma.employee.findFirst({
      where: { tazkiraNumber: tazkiraNumber.trim(), NOT: { id: req.params.id } },
    });
    if (dup) return sendError(res, 'نمبر تذکره قبلاً ثبت شده است', 409);

    const employee = await prisma.employee.update({
      where: { id: req.params.id },
      data: {
        fullName:        fullName.trim(),
        fatherName:      fatherName.trim(),
        grandfatherName: grandfatherName?.trim() || null,
        tazkiraNumber:   tazkiraNumber.trim(),
        baseSalary:      parsed,
      },
    });

    sendSuccess(res, employee, 'کارمند موفقانه بروز شد');
  } catch (err) { sendError(res, err.message); }
};

export const deleteEmployee = async (req, res) => {
  try {
    const existing = await prisma.employee.findUnique({ where: { id: req.params.id } });
    if (!existing) return sendError(res, 'کارمند یافت نشد', 404);
    // SalaryPayment rows cascade-deleted via schema onDelete: Cascade
    await prisma.employee.delete({ where: { id: req.params.id } });
    sendSuccess(res, null, 'کارمند موفقانه حذف شد');
  } catch (err) { sendError(res, err.message); }
};

// ── Salary Payments ───────────────────────────────────────────────────────────

export const getSalaryStats = async (req, res) => {
  try {
    const { start, end } = getKabulMonthRangeForDate();

    const [employeeCount, allTime, thisMonth] = await Promise.all([
      prisma.employee.count(),
      prisma.salaryPayment.aggregate({ _sum: { amount: true }, _count: true }),
      prisma.salaryPayment.aggregate({
        where: { paymentDate: { gte: start, lte: end } },
        _sum:  { amount: true },
        _count: true,
      }),
    ]);

    sendSuccess(res, {
      employeeCount,
      allTime:   { amount: allTime._sum.amount  || 0, count: allTime._count  },
      thisMonth: { amount: thisMonth._sum.amount || 0, count: thisMonth._count },
    });
  } catch (err) { sendError(res, err.message); }
};

export const createSalaryPayment = async (req, res) => {
  try {
    const { employeeId, amount, paymentDate, paymentMethod, notes } = req.body;

    if (!employeeId)  return sendError(res, 'کارمند الزامی است', 400);
    if (!amount)      return sendError(res, 'مقدار پرداخت الزامی است', 400);
    if (!paymentDate) return sendError(res, 'تاریخ پرداخت الزامی است', 400);

    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) return sendError(res, 'مقدار پرداخت باید عدد مثبت باشد', 400);

    const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
    if (!employee) return sendError(res, 'کارمند یافت نشد', 404);

    const receiptNumber = await generateReceiptNumber();
    const createdBy     = req.user?.name || req.user?.email || 'مدیر سیستم';

    const payment = await prisma.salaryPayment.create({
      data: {
        employeeId,
        amount:       parsed,
        paymentDate:  parseKabulDateString(paymentDate),
        paymentMethod: paymentMethod?.trim() || null,
        notes:        notes?.trim() || null,
        receiptNumber,
        createdBy,
      },
      include: { employee: { select: { fullName: true, fatherName: true, tazkiraNumber: true, baseSalary: true } } },
    });

    sendSuccess(res, payment, 'پرداخت معاش موفقانه ثبت شد', 201);
  } catch (err) { sendError(res, err.message); }
};

export const getSalaryPayments = async (req, res) => {
  try {
    const { employeeId, page = 1, limit = 20, dateFrom, dateTo } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where = {};
    if (employeeId) where.employeeId = employeeId;
    if (dateFrom || dateTo) {
      const range = parseKabulFilterRange({ dateFrom, dateTo });
      if (range.gte || range.lte) where.paymentDate = range;
    }

    const [payments, total] = await Promise.all([
      prisma.salaryPayment.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { paymentDate: 'desc' },
        include: {
          employee: { select: { fullName: true, fatherName: true, tazkiraNumber: true, baseSalary: true } },
        },
      }),
      prisma.salaryPayment.count({ where }),
    ]);

    sendSuccess(res, {
      payments,
      pagination: {
        total,
        page:       Number(page),
        limit:      Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err) { sendError(res, err.message); }
};

export const getSalaryPaymentById = async (req, res) => {
  try {
    const payment = await prisma.salaryPayment.findUnique({
      where: { id: req.params.id },
      include: { employee: true },
    });
    if (!payment) return sendError(res, 'رسید پرداخت یافت نشد', 404);
    sendSuccess(res, payment);
  } catch (err) { sendError(res, err.message); }
};

export const deleteSalaryPayment = async (req, res) => {
  try {
    const existing = await prisma.salaryPayment.findUnique({ where: { id: req.params.id } });
    if (!existing) return sendError(res, 'رسید پرداخت یافت نشد', 404);
    await prisma.salaryPayment.delete({ where: { id: req.params.id } });
    sendSuccess(res, null, 'رسید پرداخت حذف شد');
  } catch (err) { sendError(res, err.message); }
};
