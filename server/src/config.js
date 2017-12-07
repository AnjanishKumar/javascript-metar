'use strict';

module.exports = {
  app: {
    port: process.env.PORT || 8080,
    env: process.env.NODE_ENV || 'development',
  },
  redis: {
    enabled: true,
    uri: process.env.REDIS_URI || 'redis://localhost:6379',
    options: {
      enable_offline_queue: false,
    },
  },

  cacheTimeout: 5 * 60, // 5 min
  logging: process.env.ENABLE_LOG || true,
  debug: process.env.DEBUG || false,
};
