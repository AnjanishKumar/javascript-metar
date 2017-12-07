const config = require('./config');
const logger = require('./logger');
const redis = require('redis');

let redisClient;
if (config.redis.enabled) {
  redisClient = redis.createClient(config.redis.uri, config.redis.options);

  redisClient.on('connect', (err) => {
    logger.info('Redis client connected!');
  });

  redisClient.on('error', (err) => {
    logger.error(err);
  });
}

module.exports = redisClient;
