import jwt from 'jsonwebtoken';
import { sendError } from '../utils/response.js';

export const authenticate = (req, res, next) => {
  const headerToken = req.headers.authorization?.split(' ')[1];
  const cookieToken = req.cookies?.authToken;
  const token = headerToken || cookieToken;
  if (!token) return sendError(res, 'دسترسی رد شد. توکن موجود نیست.', 401);
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.type === 'owner') return sendError(res, 'دسترسی غیرمجاز است.', 403);
    req.user = decoded;
    next();
  } catch {
    return sendError(res, 'توکن نامعتبر است.', 401);
  }
};

export const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  sendError(res, err.message || 'خطای داخلی سرور', err.statusCode || 500);
};
