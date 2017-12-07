const AppError = require('./AppError');

class StationNotFoundError extends AppError {
  constructor(message, status) {
    super(message || 'Weather station not found.', status||404);
  }
}

module.exports = StationNotFoundError;
