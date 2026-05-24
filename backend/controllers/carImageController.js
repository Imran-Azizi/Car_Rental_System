import prisma from '../utils/prisma.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { deleteUploadedFile } from '../utils/fileUtils.js';
import { getFileUrl } from '../utils/storage.js';

export const addCarImage = async (req, res) => {
  try {
    if (!req.file) return sendError(res, 'هیچ تصویری آپلود نشد', 400);
    const url   = getFileUrl(req.file, 'cars');
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
    await prisma.carImage.delete({ where: { id: req.params.imageId } });
    deleteUploadedFile(img.url); // fire-and-forget — handles both local and Cloudinary URLs
    sendSuccess(res, null, 'تصویر حذف شد');
  } catch (err) { sendError(res, err.message); }
};
