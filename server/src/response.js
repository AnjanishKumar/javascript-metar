const logger = require('./logger');

function json(res, data, status, err) {
  let response = {};
  if (err) {
    if (err.status !== 404) {
      logger.error(err);
    }
    response.error = {};
    response.error.message = err.message || 'Internal Server Error';
    response.status = status || err.status || 500;

    return res ? res.status(response.status).json(response) : response;
  }

  response.data = data;
  return res ? res.status(status || 200).json(response): response;
}

module.exports = {
  json: json,
};
