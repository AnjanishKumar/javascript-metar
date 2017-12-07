'use strict';

const config = require('./../config');
const metarParser = require('./../parser/metar-parser');
const redisClient = require('./../redis-client');
const StationNotFoundError = require('./../error/StationNotFoundError');
const MetarParserError = require('./../error/MetarParserError');
const RemoteApiError = require('./../error/RemoteApiError');
const axios = require('axios');

const BASE_URL = 'http://tgftp.nws.noaa.gov/data/observations/metar/stations/';

function getFreshDataFromMetarServer(stationCode) {
  return new Promise((resolve, reject) => {
    let url = BASE_URL + stationCode.toUpperCase() + '.TXT';
    axios.get(url)
      .then(function(response) {
        let data = response.data.split('\n')
          .map((val) => val.trim())
          .filter((val) => !!val);
        let jsonData = metarParser.parse(data[1], data[0]);
        resolve(jsonData);
      })
      .catch(function(error) {
        if (error instanceof MetarParserError) {
          reject(error);
        } else if (error.response) {
          if (error.response.status === 404) {
            reject(new StationNotFoundError());
          } else {
            reject(new RemoteApiError('Remote weather server returned error. code: ' + error.response.status));
          }
        } else {
          reject(new RemoteApiError('Unable to reach remote weather server. reason: '+error.message));
        }
      });
  });
}

function getWeatherData(stationCode, nocache) {
  return new Promise((resolve, reject) => {
    if (nocache || !config.redis.enabled) {
      getFreshDataFromMetarServer(stationCode)
        .then((data) =>{
          if (data && config.redis.enabled) {
            redisClient.set(data.station,
              JSON.stringify(data), 'EX', config.cacheTimeout);
          }
          resolve(data);
        })
        .catch((err) => {
          reject(err);
        });
    } else {
      redisClient.get(stationCode, (err, result) => {
        if (result) {
          let data = JSON.parse(result);
          resolve(data);
        } else {
          getFreshDataFromMetarServer(stationCode)
            .then((data) =>{
              if (data && config.redis.enabled) {
                redisClient.set(data.station,
                  JSON.stringify(data), 'EX', config.cacheTimeout);
              }
              resolve(data);
            })
            .catch((err) => {
              reject(err);
            });
        }
      });
    }
  });
}

module.exports = {
  getWeatherData: getWeatherData,
};
