export const ok = (res, data = {}, status = 200) => {
  return res.status(status).json({
    success: true,
    ...data
  });
};

export const fail = (res, message = "Error", status = 400, extra = {}) => {
  return res.status(status).json({
    success: false,
    error: message,
    ...extra
  });
};
