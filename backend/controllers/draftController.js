import prisma from '../utils/prisma.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const getDrafts = async (req, res) => {
  try {
    const drafts = await prisma.orderDraft.findMany({
      orderBy: { updatedAt: 'desc' },
      select: { id: true, name: true, step: true, createdAt: true, updatedAt: true },
    });
    sendSuccess(res, drafts);
  } catch (err) { sendError(res, err.message); }
};

export const getDraftById = async (req, res) => {
  try {
    const draft = await prisma.orderDraft.findUnique({ where: { id: req.params.id } });
    if (!draft) return sendError(res, 'پیش‌نویس یافت نشد', 404);
    sendSuccess(res, draft);
  } catch (err) { sendError(res, err.message); }
};

export const createDraft = async (req, res) => {
  try {
    const { name, step = 0, formData } = req.body;
    if (!formData) return sendError(res, 'داده‌های فرم الزامی است', 400);
    const draft = await prisma.orderDraft.create({
      data: { name: name || `پیش‌نویس ${new Date().toLocaleDateString('fa-AF')}`, step, formData },
    });
    sendSuccess(res, draft, 'پیش‌نویس ذخیره شد', 201);
  } catch (err) { sendError(res, err.message); }
};

export const updateDraft = async (req, res) => {
  try {
    const { name, step, formData } = req.body;
    const existing = await prisma.orderDraft.findUnique({ where: { id: req.params.id } });
    if (!existing) return sendError(res, 'پیش‌نویس یافت نشد', 404);
    const draft = await prisma.orderDraft.update({
      where: { id: req.params.id },
      data: {
        ...(name      !== undefined && { name }),
        ...(step      !== undefined && { step }),
        ...(formData  !== undefined && { formData }),
      },
    });
    sendSuccess(res, draft, 'پیش‌نویس بروز شد');
  } catch (err) { sendError(res, err.message); }
};

export const deleteDraft = async (req, res) => {
  try {
    const existing = await prisma.orderDraft.findUnique({ where: { id: req.params.id } });
    if (!existing) return sendError(res, 'پیش‌نویس یافت نشد', 404);
    await prisma.orderDraft.delete({ where: { id: req.params.id } });
    sendSuccess(res, null, 'پیش‌نویس حذف شد');
  } catch (err) { sendError(res, err.message); }
};
