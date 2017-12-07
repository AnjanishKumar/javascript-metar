class AppError extends Error {
  constructor(message, status) {
    super(message);

    this.name = this.constructor.name;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
    this.status = status || 500;
  }
}

module.exports = AppError;
