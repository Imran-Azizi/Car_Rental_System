import prisma from '../utils/prisma.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const getCars = async (req, res) => {
  try {
    const { status, search, ownerId } = req.query;
    const where = {};
    if (status) where.status = status;
    if (ownerId) where.ownerId = ownerId;
    if (search) where.OR = [
      { carName: { contains: search, mode: 'insensitive' } },
      { plateNumber: { contains: search, mode: 'insensitive' } },
      { carType: { contains: search, mode: 'insensitive' } },
      { owner: { fullName: { contains: search, mode: 'insensitive' } } },
    ];
    const cars = await prisma.car.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        owner: { select: { id: true, fullName: true, phoneNumber: true } },
        images: { orderBy: { order: 'asc' } },
        _count: { select: { rentalContracts: true } },
      },
    });
    sendSuccess(res, cars);
  } catch (err) { sendError(res, err.message); }
};

export const getCarById = async (req, res) => {
  try {
    const car = await prisma.car.findUnique({
      where: { id: req.params.id },
      include: {
        owner: true,
        images: { orderBy: { order: 'asc' } },
        rentalContracts: { include: { customer: true }, orderBy: { createdAt: 'desc' } },
      },
    });
    if (!car) return sendError(res, 'موتر یافت نشد', 404);
    sendSuccess(res, car);
  } catch (err) { sendError(res, err.message); }
};

export const createCar = async (req, res) => {
  try {
    // eslint-disable-next-line no-unused-vars
    const { ownerId, chassisNumber, ...rest } = req.body;
    const data = { ...rest };
    if (ownerId) data.ownerId = ownerId;
    const car = await prisma.car.create({ data, include: { owner: { select: { id: true, fullName: true } } } });
    sendSuccess(res, car, 'موتر موفقانه اضافه شد', 201);
  } catch (err) {
    if (err.code === 'P2002') return sendError(res, 'نمبر پلیت قبلاً موجود است', 400);
    sendError(res, err.message);
  }
};

export const updateCar = async (req, res) => {
  try {
    // eslint-disable-next-line no-unused-vars
    const { ownerId, chassisNumber, ...rest } = req.body;
    const data = { ...rest };
    data.ownerId = ownerId || null;
    const car = await prisma.car.update({
      where: { id: req.params.id },
      data,
      include: { owner: { select: { id: true, fullName: true } } },
    });
    sendSuccess(res, car, 'موتر موفقانه بروز شد');
  } catch (err) { sendError(res, err.message); }
};

export const deleteCar = async (req, res) => {
  try {
    await prisma.car.delete({ where: { id: req.params.id } });
    sendSuccess(res, null, 'موتر موفقانه حذف شد');
  } catch (err) { sendError(res, err.message); }
};
