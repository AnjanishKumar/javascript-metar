'use strict';

const config = require('./config');
const logger = require('./logger');

const express = require('express');
const response = require('./response');
const weatherService = require('./service/metar-weather-service');
const AppError = require('./error/AppError');


const app = express();

app.get('/', function(req, res) {
  response.json(res, 'Get metar data in human friendly format.');
});

app.get('/metar/ping', function(req, res) {
  response.json(res, 'pong');
});

app.get('/metar/info', function(req, res) {
  let stationCode = req.query.scode;
  let nocache = req.query.nocache == 1;
  if (!stationCode) {
    let error = new AppError('query param scode is missing');
    response.json(res, null, 404, error);
  } else {
    weatherService.getWeatherData(stationCode, nocache)
      .then((data) => {
        response.json(res, data);
      })
      .catch((error) =>{
        response.json(res, null, null, error);
      });
  }
});


app.listen(config.app.port, () => {
  logger.info(`Server is listening on port: ${config.app.port}`);
}).on('error', (err) =>{
  logger.error(`Failed to start server on port:${config.app.port}`);
  logger.error(`Error: ${err.message}`);
  logger.error(err);
});

module.exports = app;
