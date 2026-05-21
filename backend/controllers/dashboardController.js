import prisma from '../utils/prisma.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const getDashboardStats = async (req, res) => {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const [
      totalCars,
      availableCars,
      rentedCars,
      totalCustomers,
      activeContracts,
      completedContracts,
      overdueContracts,
      totalContractsCount,
      payments,
      recentPayments,
      pendingPaymentsAgg,
      totalContractValueAgg,
      recentContracts,
      pendingContractsList,
    ] = await Promise.all([
      prisma.car.count(),
      prisma.car.count({ where: { status: 'AVAILABLE' } }),
      prisma.car.count({ where: { status: 'RENTED' } }),
      prisma.customer.count(),
      prisma.rentalContract.count({ where: { status: 'ACTIVE' } }),
      prisma.rentalContract.count({ where: { status: 'COMPLETED' } }),
      prisma.rentalContract.count({ where: { status: 'OVERDUE' } }),
      prisma.rentalContract.count(),
      prisma.payment.findMany({ select: { amount: true, paymentDate: true } }),
      prisma.payment.findMany({
        where: { createdAt: { gte: sixMonthsAgo } },
        select: { amount: true, paymentDate: true, createdAt: true },
      }),
      prisma.rentalContract.aggregate({
        _sum: { remainingAmount: true },
        where: { status: { in: ['ACTIVE', 'OVERDUE'] } },
      }),
      prisma.rentalContract.aggregate({
        _sum: { totalRent: true },
      }),
      prisma.rentalContract.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          car: { select: { carName: true, plateNumber: true } },
          customer: { select: { fullName: true, phoneNumber: true } },
        },
      }),
      prisma.rentalContract.findMany({
        where: { status: 'ACTIVE', remainingAmount: { gt: 0 } },
        orderBy: { remainingAmount: 'desc' },
        take: 20,
        select: {
          id: true,
          contractNumber: true,
          remainingAmount: true,
          totalRent: true,
          status: true,
          customer: { select: { fullName: true, phoneNumber: true } },
          car: { select: { carName: true, plateNumber: true } },
        },
      }),
    ]);

    const totalIncome = payments.reduce((s, p) => s + p.amount, 0);
    const totalContractValue = totalContractValueAgg._sum.totalRent || 0;
    const totalPending = pendingPaymentsAgg._sum.remainingAmount || 0;
    const totalReceived = totalContractValue - totalPending;

    // Monthly income (last 6 months)
    const monthlyIncome = {};
    recentPayments.forEach(p => {
      const key = `${p.paymentDate.getFullYear()}-${String(p.paymentDate.getMonth() + 1).padStart(2, '0')}`;
      monthlyIncome[key] = (monthlyIncome[key] || 0) + p.amount;
    });

    // Recent payments list (last 10) with contract + customer info
    const recentPaymentsList = await prisma.payment.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        amount: true,
        paymentDate: true,
        createdAt: true,
        rentalContract: {
          select: {
            contractNumber: true,
            customer: { select: { fullName: true } },
          },
        },
      },
    });

    sendSuccess(res, {
      totalCars, availableCars, rentedCars, totalCustomers,
      activeContracts, completedContracts, overdueContracts,
      totalContractsCount,
      totalIncome,
      totalContractValue,
      totalReceived,
      pendingPayments: totalPending,
      monthlyIncome,
      recentContracts,
      pendingContractsList,
      recentPaymentsList,
    });
  } catch (err) { sendError(res, err.message); }
};
