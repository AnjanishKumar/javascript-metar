const AppError = require('./AppError');

class RemoteApiError extends AppError {
  constructor(message, status) {
    super(message || 'Remote Weather service not available', status||503);
  }
}

module.exports = RemoteApiError;
