import prisma from '../utils/prisma.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const getDashboardStats = async (req, res) => {
  try {
    const [totalCars, availableCars, rentedCars, totalCustomers, activeContracts, completedContracts, overdueContracts, payments] = await Promise.all([
      prisma.car.count(),
      prisma.car.count({ where: { status: 'AVAILABLE' } }),
      prisma.car.count({ where: { status: 'RENTED' } }),
      prisma.customer.count(),
      prisma.rentalContract.count({ where: { status: 'ACTIVE' } }),
      prisma.rentalContract.count({ where: { status: 'COMPLETED' } }),
      prisma.rentalContract.count({ where: { status: 'OVERDUE' } }),
      prisma.payment.findMany({ select: { amount: true, paymentDate: true } }),
    ]);

    const totalIncome = payments.reduce((s, p) => s + p.amount, 0);
    const pendingPayments = await prisma.rentalContract.aggregate({ _sum: { remainingAmount: true }, where: { status: { in: ['ACTIVE', 'OVERDUE'] } } });

    // Monthly income (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const recentPayments = await prisma.payment.findMany({ where: { paymentDate: { gte: sixMonthsAgo } }, select: { amount: true, paymentDate: true } });
    
    const monthlyIncome = {};
    recentPayments.forEach(p => {
      const key = `${p.paymentDate.getFullYear()}-${String(p.paymentDate.getMonth() + 1).padStart(2, '0')}`;
      monthlyIncome[key] = (monthlyIncome[key] || 0) + p.amount;
    });

    const recentContracts = await prisma.rentalContract.findMany({
      take: 5, orderBy: { createdAt: 'desc' },
      include: { car: { select: { carName: true, plateNumber: true } }, customer: { select: { fullName: true, phoneNumber: true } } }
    });

    sendSuccess(res, {
      totalCars, availableCars, rentedCars, totalCustomers,
      activeContracts, completedContracts, overdueContracts,
      totalIncome, pendingPayments: pendingPayments._sum.remainingAmount || 0,
      monthlyIncome, recentContracts
    });
  } catch (err) { sendError(res, err.message); }
};
