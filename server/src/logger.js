'use strict';
const config = require('./config');

function log(...args) {
  config.logging && console.log(...args);
}

function debug(...args) {
  config.debug && console.log(...args);
}

const logger = {
  debug: debug,
  error: log,
  info: log,
};

module.exports = logger;
