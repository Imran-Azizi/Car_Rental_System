import prisma from '../utils/prisma.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const getOwnerDashboard = async (req, res) => {
  try {
    const ownerId = req.owner.id;

    const [
      cars, contractStats, totalEarnings, activeContracts,
      recentContracts, ownerShareAgg, totalContractValue,
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
        where: { rentalContract: { car: { ownerId } } },
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
        where: { car: { ownerId } },
        _sum: { ownerShare: true },
      }),
      prisma.rentalContract.aggregate({
        where: { car: { ownerId } },
        _sum: { totalRent: true },
      }),
    ]);

    const totalCars     = cars.length;
    const availableCars = cars.filter(c => c.status === 'AVAILABLE').length;
    const rentedCars    = cars.filter(c => c.status === 'RENTED').length;

    const statusMap = {};
    contractStats.forEach(s => { statusMap[s.status] = s._count.id; });

    sendSuccess(res, {
      stats: {
        totalCars,
        availableCars,
        rentedCars,
        activeContracts,
        totalContractValue:  totalContractValue._sum.totalRent || 0,
        totalReceived:       totalEarnings._sum.amount         || 0,
        ownerShareTotal:     ownerShareAgg._sum.ownerShare     || 0,
        completedContracts:  statusMap['COMPLETED'] || 0,
        cancelledContracts:  statusMap['CANCELLED'] || 0,
      },
      recentContracts,
      cars,
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
      { carName: { contains: search, mode: 'insensitive' } },
      { plateNumber: { contains: search, mode: 'insensitive' } },
      { carType: { contains: search, mode: 'insensitive' } },
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
          select: {
            id: true, contractNumber: true, startDate: true, endDate: true,
            customer: { select: { fullName: true, phoneNumber: true } },
          },
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
        car: { select: { id: true, carName: true, carType: true, plateNumber: true, model: true } },
        customer: { select: { fullName: true, phoneNumber: true } },
        payments: { select: { id: true, amount: true, paymentDate: true, paymentMethod: true } },
      },
    });

    sendSuccess(res, contracts);
  } catch (err) {
    sendError(res, err.message);
  }
};

