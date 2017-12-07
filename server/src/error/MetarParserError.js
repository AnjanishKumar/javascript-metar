const AppError = require('./AppError');

class MetarParserError extends AppError {
  constructor(message, status) {
    super(message || 'METAR data parsing failed.', status||500);
  }
}

module.exports = MetarParserError;
