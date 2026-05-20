export const sendSuccess = (res, data, message = 'موفقانه انجام شد', statusCode = 200) => {
  return res.status(statusCode).json({ success: true, message, data });
};
export const sendError = (res, message = 'خطا رخ داد', statusCode = 500, errors = null) => {
  return res.status(statusCode).json({ success: false, message, errors });
};
