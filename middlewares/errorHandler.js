module.exports = function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  const statusCode = Number.isInteger(err.statusCode) ? err.statusCode : 500;
  const isOperational = err.isOperational === true;

  const payload = {
    success: false,
    data: null,
    message: isOperational ? err.message : 'Internal server error',
  };

  if (process.env.NODE_ENV !== 'production') {
    payload.details = err.stack;
  }

  res.status(statusCode).json(payload);
};