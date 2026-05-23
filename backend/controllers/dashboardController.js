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
      totalContractsCount,
      paymentsForMonthly,
      pendingPaymentsAgg,
      totalContractValueAgg,
      ownerShareAllAgg,       // owner share from ALL contracts
      adminShareAllAgg,       // admin share from ALL contracts
      ownerShareCompletedAgg, // owner share from COMPLETED only
      adminShareCompletedAgg, // admin share from COMPLETED only
      recentContracts,
      pendingContractsList,
      recentPaymentsList,
      expenseSplitsAgg,
    ] = await Promise.all([
      prisma.car.count(),
      prisma.car.count({ where: { status: 'AVAILABLE' } }),
      prisma.car.count({ where: { status: 'RENTED' } }),
      prisma.customer.count(),
      prisma.rentalContract.count({ where: { status: 'ACTIVE' } }),
      prisma.rentalContract.count({ where: { status: 'COMPLETED' } }),
      prisma.rentalContract.count(),
      prisma.payment.findMany({
        where: { paymentDate: { gte: sixMonthsAgo } },
        select: { amount: true, paymentDate: true },
      }),
      prisma.rentalContract.aggregate({
        _sum: { remainingAmount: true },
        where: { status: { in: ['ACTIVE', 'OVERDUE'] } },
      }),
      prisma.rentalContract.aggregate({ _sum: { totalRent: true } }),
      // Owner / admin share from ALL contracts (shows full picture)
      prisma.rentalContract.aggregate({ _sum: { ownerShare: true } }),
      prisma.rentalContract.aggregate({ _sum: { adminShare: true } }),
      // Owner / admin share from COMPLETED contracts only
      prisma.rentalContract.aggregate({ _sum: { ownerShare: true }, where: { status: 'COMPLETED' } }),
      prisma.rentalContract.aggregate({ _sum: { adminShare: true }, where: { status: 'COMPLETED' } }),
      prisma.rentalContract.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          car:      { select: { carName: true, plateNumber: true } },
          customer: { select: { fullName: true, phoneNumber: true } },
        },
      }),
      prisma.rentalContract.findMany({
        where: { status: 'ACTIVE', remainingAmount: { gt: 0 } },
        orderBy: { remainingAmount: 'desc' },
        take: 20,
        select: {
          id: true, contractNumber: true, remainingAmount: true,
          totalRent: true, status: true,
          customer: { select: { fullName: true, phoneNumber: true } },
          car:      { select: { carName: true, plateNumber: true } },
        },
      }),
      prisma.payment.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, amount: true, paymentDate: true,
          rentalContract: {
            select: {
              contractNumber: true,
              customer: { select: { fullName: true } },
            },
          },
        },
      }),
      // Total expense deductions by split — must be last to match destructuring
      prisma.expense.aggregate({ _sum: { adminShare: true, ownerShare: true, amount: true } }),
    ]);

    const totalContractValue    = totalContractValueAgg._sum.totalRent         || 0;
    const pendingPayments       = pendingPaymentsAgg._sum.remainingAmount       || 0;
    const totalReceived         = totalContractValue - pendingPayments;
    const ownerIncome           = ownerShareAllAgg._sum.ownerShare              || 0;
    const adminIncome           = adminShareAllAgg._sum.adminShare              || 0;
    const ownerIncomeCompleted  = ownerShareCompletedAgg._sum.ownerShare        || 0;
    const adminIncomeCompleted  = adminShareCompletedAgg._sum.adminShare        || 0;
    const totalExpenses         = expenseSplitsAgg._sum.amount                 || 0;
    const adminExpenses         = expenseSplitsAgg._sum.adminShare             || 0;
    const ownerExpenses         = expenseSplitsAgg._sum.ownerShare             || 0;
    const adminNetIncome        = adminIncome - adminExpenses;
    const ownerNetIncome        = ownerIncome - ownerExpenses;

    // Monthly income chart — last 6 months
    const monthlyIncome = {};
    paymentsForMonthly.forEach(p => {
      const key = `${p.paymentDate.getFullYear()}-${String(p.paymentDate.getMonth() + 1).padStart(2, '0')}`;
      monthlyIncome[key] = (monthlyIncome[key] || 0) + p.amount;
    });

    sendSuccess(res, {
      totalCars, availableCars, rentedCars, totalCustomers,
      activeContracts, completedContracts,
      totalContractsCount,
      totalContractValue,
      totalReceived,
      pendingPayments,
      ownerIncome,
      adminIncome,
      ownerIncomeCompleted,
      adminIncomeCompleted,
      totalExpenses,
      adminExpenses,
      ownerExpenses,
      adminNetIncome,
      ownerNetIncome,
      monthlyIncome,
      recentContracts,
      pendingContractsList,
      recentPaymentsList,
    });
  } catch (err) { sendError(res, err.message); }
};
