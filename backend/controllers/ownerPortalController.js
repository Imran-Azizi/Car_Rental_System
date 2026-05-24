import prisma from '../utils/prisma.js';
import { sendSuccess, sendError } from '../utils/response.js';

/**
 * Strip all sensitive financial/customer data from a contract while it has
 * NOT yet been returned (ACTIVE or OVERDUE). Only the booking window is
 * visible. Full details are revealed once status is COMPLETED or CANCELLED.
 */
function maskIfActive(contract) {
  if (!contract) return contract;
  const shouldMask = contract.status === 'ACTIVE' || contract.status === 'OVERDUE';
  if (!shouldMask) return contract;
  return {
    id:              contract.id,
    contractNumber:  contract.contractNumber,
    status:          contract.status,
    startDate:       contract.startDate,
    endDate:         contract.endDate,
    car:             contract.car     ?? null,
    createdAt:       contract.createdAt ?? null,
    // All sensitive fields hidden until the car is returned
    customer:        null,
    guarantor:       null,
    totalRent:       null,
    remainingAmount: null,
    advancePayment:  null,
    rentPrice:       null,
    ownerShare:      null,
    adminShare:      null,
    payments:        [],
    _masked:         true,
  };
}

export const getOwnerDashboard = async (req, res) => {
  try {
    const ownerId = req.owner.id;

    const [
      cars, contractStats, totalEarnings, activeContracts,
      recentContracts, ownerShareAgg, totalContractValue,
      expenseDeductionsAgg, unreadNotificationCount,
    ] = await Promise.all([
      prisma.car.findMany({
        where: { ownerId },
        select: { id: true, carName: true, carType: true, model: true, color: true, plateNumber: true, status: true, dailyRate: true },
      }),
      prisma.rentalContract.groupBy({
        by: ['status'],
        where: { car: { ownerId } },
        _count: { id: true },
      }),
      prisma.payment.aggregate({
        where: { rentalContract: { car: { ownerId }, status: 'COMPLETED' } },
        _sum: { amount: true },
      }),
      prisma.rentalContract.count({ where: { car: { ownerId }, status: 'ACTIVE' } }),
      prisma.rentalContract.findMany({
        where: { car: { ownerId } },
        orderBy: { createdAt: 'desc' },
        take: 8,
        select: {
          id: true, contractNumber: true, status: true, startDate: true, endDate: true,
          totalRent: true, remainingAmount: true, ownerShare: true, adminShare: true,
          car:      { select: { carName: true, plateNumber: true } },
          customer: { select: { fullName: true, phoneNumber: true } },
        },
      }),
      prisma.rentalContract.aggregate({
        where: { car: { ownerId }, status: 'COMPLETED' },
        _sum: { ownerShare: true },
      }),
      prisma.rentalContract.aggregate({
        where: { car: { ownerId }, status: 'COMPLETED' },
        _sum: { totalRent: true },
      }),
      // Total expense deductions billed to this owner
      prisma.expense.aggregate({
        where: { car: { ownerId } },
        _sum: { ownerShare: true },
      }),
      // Unread notifications count
      prisma.ownerNotification.count({ where: { ownerId, isRead: false } }),
    ]);

    const totalCars     = cars.length;
    const availableCars = cars.filter(c => c.status === 'AVAILABLE').length;
    const rentedCars    = cars.filter(c => c.status === 'RENTED').length;

    const statusMap = {};
    contractStats.forEach(s => { statusMap[s.status] = s._count.id; });

    const ownerShareTotal      = ownerShareAgg._sum.ownerShare || 0;
    const totalExpenseDeducted = expenseDeductionsAgg._sum.ownerShare || 0;
    const netOwnerShare        = ownerShareTotal - totalExpenseDeducted;

    sendSuccess(res, {
      stats: {
        totalCars,
        availableCars,
        rentedCars,
        activeContracts,
        totalContractValue:    totalContractValue._sum.totalRent || 0,
        totalReceived:         totalEarnings._sum.amount         || 0,
        ownerShareTotal,
        totalExpenseDeducted,
        netOwnerShare,
        completedContracts:    statusMap['COMPLETED'] || 0,
        cancelledContracts:    statusMap['CANCELLED'] || 0,
      },
      recentContracts: recentContracts.map(maskIfActive),
      cars,
      unreadNotificationCount,
    });
  } catch (err) {
    sendError(res, err.message);
  }
};

export const getOwnerCars = async (req, res) => {
  try {
    const ownerId = req.owner.id;
    const { search, status } = req.query;

    const where = { ownerId };
    if (status) where.status = status;
    if (search) where.OR = [
      { carName:     { contains: search, mode: 'insensitive' } },
      { plateNumber: { contains: search, mode: 'insensitive' } },
      { carType:     { contains: search, mode: 'insensitive' } },
    ];

    const cars = await prisma.car.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        images: { orderBy: { order: 'asc' }, take: 1 },
        _count: { select: { rentalContracts: true } },
        rentalContracts: {
          where: { status: 'ACTIVE' },
          take: 1,
          select: { id: true, startDate: true, endDate: true },
        },
      },
    });

    sendSuccess(res, cars);
  } catch (err) {
    sendError(res, err.message);
  }
};

export const getOwnerContracts = async (req, res) => {
  try {
    const ownerId = req.owner.id;
    const { search, status } = req.query;

    const where = { car: { ownerId } };
    if (status) where.status = status;
    if (search) where.OR = [
      { contractNumber: { contains: search, mode: 'insensitive' } },
      { customer: { fullName: { contains: search, mode: 'insensitive' } } },
      { car: { carName: { contains: search, mode: 'insensitive' } } },
      { car: { plateNumber: { contains: search, mode: 'insensitive' } } },
    ];

    const contracts = await prisma.rentalContract.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        car:      { select: { id: true, carName: true, carType: true, plateNumber: true, model: true } },
        customer: { select: { fullName: true, phoneNumber: true } },
        payments: { select: { id: true, amount: true, paymentDate: true, paymentMethod: true } },
      },
    });

    sendSuccess(res, contracts.map(maskIfActive));
  } catch (err) {
    sendError(res, err.message);
  }
};

// ── Notifications ─────────────────────────────────────────────────────────────

export const getOwnerNotifications = async (req, res) => {
  try {
    const ownerId = req.owner.id;
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.ownerNotification.findMany({
        where: { ownerId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.ownerNotification.count({ where: { ownerId } }),
      prisma.ownerNotification.count({ where: { ownerId, isRead: false } }),
    ]);

    sendSuccess(res, {
      notifications,
      pagination: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) },
      unreadCount,
    });
  } catch (err) { sendError(res, err.message); }
};

export const getUnreadNotificationCount = async (req, res) => {
  try {
    const count = await prisma.ownerNotification.count({
      where: { ownerId: req.owner.id, isRead: false },
    });
    sendSuccess(res, { count });
  } catch (err) { sendError(res, err.message); }
};

export const markNotificationRead = async (req, res) => {
  try {
    await prisma.ownerNotification.updateMany({
      where: { id: req.params.id, ownerId: req.owner.id },
      data: { isRead: true },
    });
    sendSuccess(res, null, 'اعلان خوانده شد');
  } catch (err) { sendError(res, err.message); }
};

export const markAllNotificationsRead = async (req, res) => {
  try {
    await prisma.ownerNotification.updateMany({
      where: { ownerId: req.owner.id, isRead: false },
      data: { isRead: true },
    });
    sendSuccess(res, null, 'همه اعلان‌ها خوانده شدند');
  } catch (err) { sendError(res, err.message); }
};
