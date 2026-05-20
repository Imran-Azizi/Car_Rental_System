import prisma from '../utils/prisma.js';
import { sendSuccess, sendError } from '../utils/response.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const addCarImage = async (req, res) => {
  try {
    if (!req.file) return sendError(res, 'هیچ تصویری آپلود نشد', 400);
    const url = `/uploads/cars/${req.file.filename}`;
    const count = await prisma.carImage.count({ where: { carId: req.params.id } });
    const image = await prisma.carImage.create({
      data: { carId: req.params.id, url, order: count },
    });
    sendSuccess(res, image, 'تصویر اضافه شد', 201);
  } catch (err) { sendError(res, err.message); }
};

export const deleteCarImage = async (req, res) => {
  try {
    const img = await prisma.carImage.findUnique({ where: { id: req.params.imageId } });
    if (!img) return sendError(res, 'تصویر یافت نشد', 404);
    const filePath = path.join(__dirname, '..', img.url);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    await prisma.carImage.delete({ where: { id: req.params.imageId } });
    sendSuccess(res, null, 'تصویر حذف شد');
  } catch (err) { sendError(res, err.message); }
};
