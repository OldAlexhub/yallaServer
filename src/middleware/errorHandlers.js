export const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    success: false,
    error: "Route not found"
  });
};

export const globalErrorHandler = (err, req, res, next) => {
  console.error("GLOBAL ERROR:", err);

  if (res.headersSent) {
    return next(err);
  }

  res.status(500).json({
    success: false,
    error: "Internal server error"
  });
};
