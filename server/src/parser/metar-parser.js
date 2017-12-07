'use strict';

const logger = require('../logger');
const MetarParserError = require('./../error/MetarParserError');
const {Metar, Wind, Visibility, Pressure, Temperature, Sky, Weather, Rvr} = require('./Metar');


const TOKEN_SEPARATOR = ' ';

/**
 * parses the raw metar data to json format.
 *
 * Reference:
 *  https://math.la.asu.edu/~eric/workshop/METAR.html
 */
class MetarParser {
  constructor(data, date) {
    this.raw = data;
    this.date = date;
    this.metar = new Metar();
    this.tokens = [];
    this.index = 0;
  }

  next() {
    this.index++;
  }

  hasToken() {
    return this.tokens.length > this.index;
  }

  currentToken() {
    if (this.tokens.length > this.index) {
      return this.tokens[this.index];
    } else {
      return null;
    }
  }

  parseType() {
    if (!this.hasToken()) {
      return this;
    }
    let token = this.currentToken();

    if (token === 'METAR' || token === 'SPECI') {
      this.metar.type = token;
      logger.debug('Type', this.metar.type);
      this.next();
    } else {
      this.metar.type = 'METAR';
    }
    return this;
  }

  // Required
  parseStationIdentifier() {
    let token = this.currentToken();
    let stationRegx = /^[a-zA-Z0-9]{4}$/;
    if (token.match(stationRegx)) {
      this.metar.station = token;
      this.next();
    } else {
      throw new MetarParserError('Invalid station code. code: '+token);
    }
    return this;
  }

  // Required
  parseDateAndTime() {
    let token = this.currentToken();
    let dateRegx = /^(\d{2})(\d{2})(\d{2})Z$/;
    let values = token.match(dateRegx);
    if (values) {
      let d;
      if (this.date) {
        d= new Date(this.date);
      }
      if (isNaN(d)) {
        d = new Date();
      }

      d.setUTCDate(parseInt(values[1]));
      d.setUTCHours(parseInt(values[2]));
      d.setUTCMinutes(parseInt(values[3]));
      d.setUTCSeconds(0);
      d.setUTCMilliseconds(0);
      this.metar.time = d;
      this.next();
    } else {
      throw new MetarParserError('Invalid date received. Token: '+token);
    }
    return this;
  }

  // Optional
  parseModifier() {
    let token = this.currentToken();
    if (!token) {
      return this;
    }

    let modRegx = /^(AUTO|COR)$/;
    let values = token.match(modRegx);
    if (values) {
      this.metar.mod = values[1];
      this.next();
    }
    return this;
  }

  parseWind() {
    let token = this.currentToken();
    if (!token) {
      return this;
    }

    let windRegx = /^(\d{3}||VRB)(\d{2,3})(G)?(\d{2,3})?KT$/;
    let values = token.match(windRegx);
    if (values) {
      let wind = new Wind();

      let direction = values[1];
      wind.direction = direction === 'VRB' ? 'VRB' : parseInt(values[1]);
      wind.speed = parseInt(values[2]);
      wind.unit = 'KT';
      wind.guts = (values[3] && values[4]) ? parseInt(values[4]): null;

      this.metar.wind = wind;
      this.next();

      token = this.currentToken();
      if (!token) {
        return this;
      }
      // parse wind variation if available
      let variableWindDirRegx = /^(\d{3})V(\d{3})$/;
      values = token.match(variableWindDirRegx);
      if (values) {
        this.metar.wind.variation.min = parseInt(values[1]);
        this.metar.wind.variation.max = parseInt(values[2]);
        this.next();
      }
    }
    if (token.match(/^\/+(KT)?$/)) {
      this.next();
    }
    return this;
  }

  parseCavok() {
    let token = this.currentToken();
    if (!token) {
      return this;
    }
    if (token === 'CAVOK') {
      this.metar.cavok = true;
      this.next();
    }
    return this;
  }


  parseVisibility() {
    let token = this.currentToken();
    if (!token) {
      return this;
    }

    // https://bmtc.moodle.com.au/mod/book/view.php?id=5674&chapterid=4248
    let visRegx = /^(M|P)?(\d{4}|\/\/\/\/)(NDV|SM|KM|M)?$/;
    let vis = new Visibility();
    let values = token.match(visRegx);
    if (values) {
      vis.value = values[2];
      if (!values[3] || values[3] === 'NDV') {
        vis.unit = 'M';
      } else {
        vis.unit = values[3] || 'M';
      }
      vis.modifier = values[1] ? values[1]: null;
      this.metar.visibility = vis;

      this.next();
      token = this.currentToken();
      if (!token) {
        return this;
      }
      let lowVisRegx = /^(\d{4})([A-Z]{2})$/;
      values = token.match(lowVisRegx);
      if (values) {
        vis.low.value = values[1];
        vis.low.direction = values[2];
        vis.low.unit = 'M';
        this.next();
      }
    } else {
      visRegx = /^(M|P)(\d+)$/;
      values = token.match(visRegx);
      if (values) {
        let regEx = /^(\d+\/\d+)(SM|KM|M)$/;
        let nextToken = this.tokens[this.index++];
        if (!nextToken) {
          return this;
        }

        let result = nextToken.match(regEx);
        if (result) {
          vis.value = parseInt(values[2]) + parseFloat(eval(result[1]));
          vis.modifier= values[1] ? values[1]: '';
          vis.unit= result[2];
          this.metar.visibility = vis;
        } else {
          throw new MetarParserError('Invalid visibility token: '+token + ' ' + nextToken);
        }
      } else {
        visRegx = /^(M|P)?(\d+)?\/?(\d+)?(SM|KM|M)$/;
        values = token.match(visRegx);
        if (values) {
          let val;
          if (values[2] && values[3]) {
            val = parseInt(values[2])/parseInt(values[3]);
          } else if (values[2]) {
            val = parseInt(values[2]);
          }

          vis.value = val;
          vis.modifier= values[1] ? values[1]: '';
          vis.unit= values[4];
          this.metar.visibility = vis;
          this.next();
        }
      }
    }
    return this;
  }


  parseRunwayVisualRange() {
    let token = this.currentToken();
    if (!token) {
      return this;
    }

    let rvrRegx = /^R(\d{2})(R|L|C)?\/([M|P])?(\d{4})V?([M|P])?(\d{4})?FT$/;
    let values;
    while ( (values = token.match(rvrRegx))) {
      let rvr = new Rvr();
      rvr.runway_no = parseInt(values[1]);
      if (values[2]) {
        rvr.approach_direction = values[2];
      }
      rvr.visibility={};
      if (values[4]) {
        rvr.visibility.min = {
          value: values[4],
          modifier: values[3] || '',
          unit: 'FT',
        };
      }
      if (values[6]) {
        rvr.visibility.max = {
          value: values[6],
          modifier: values[5] || '',
          unit: 'FT',
        };
      }

      this.metar.rvr.push(rvr);
      this.next();
      token = this.currentToken();
      if (!token) {
        break;
      }
    }
    return this;
  }


  parsePresentWeather() {
    let token = this.currentToken();
    if (!token) {
      return this;
    }

    let weatherRegx = /^(\+|\-|VC)?(MI|PR|BC|DR|BL|SH|TS|FZ)?(DZ|RA|SN|SG|IC|PL|GR|GS|UP|BR|FG|FU|VA|DU|SA|HZ|PY|PO|SQ|FC|SS|DS)?$/;
    let values;
    while ((values = token.match(weatherRegx))) {
      if (!values[2] && !values[3]) {
        break;
      }
      let weather = new Weather();
      weather.intensity = values[1] || '';
      weather.descriptor = values[2] || null;
      weather.phenomena = values[3];
      this.metar.weather.push(weather);

      this.next();
      token = this.currentToken();
      if (!token) {
        break;
      }
    }
    return this;
  }


  parseSkyCondition() {
    let token = this.currentToken();
    if (!token) {
      return this;
    }

    let skyCondRegx = /^(VV|SKC|CLR|FEW|SCT|BKN|OVC|NSC)(\d{3}|[\/\/\/])?(CU|CB|TCU|CI)?$/;
    let values;
    this.metar.sky = [];
    while ((values = token.match(skyCondRegx))) {
      let ksyCond = new Sky();
      ksyCond.cover = values[1];
      if (values[2]) {
        if (values[2] === '///') { // layer is below station level
          ksyCond.height = values[2];
        } else {
          ksyCond.height = parseInt(values[2]);
        }
      }
      if (values[3]) {
        ksyCond.suffix = values[3];
      }
      ksyCond.unit = 'FT';
      this.metar.sky.push(ksyCond);

      this.next();
      token = this.currentToken();
      if (!token) {
        break;
      }
    }
    return this;
  }

  parseTempAndDewPoint() {
    let token = this.currentToken();
    if (!token) {
      return this;
    }

    let tempAndDewRegx = /^(M)?(\d{2})\/(M)?(\d{2})?$/;
    let values = token.match(tempAndDewRegx);
    if (values) {
      let temp = new Temperature();
      temp.value = parseInt(values[2]);
      temp.unit = 'C';
      temp.modifier = values[1] ? values[1]: '';
      this.metar.temp = temp;

      temp = new Temperature();
      temp.value = parseInt(values[4]);
      temp.unit = 'C';
      temp.modifier = values[3]? values[3] : '';
      this.metar.dew = temp;

      this.next();
    }
    return this;
  }

  parsePressure() {
    let token = this.currentToken();
    if (!token) {
      return this;
    }

    // TODO: Add support for A|Q
    let pressureRegx = /^([A|Q])(\d{4})$/;
    let values = token.match(pressureRegx);
    if (values) {
      let pressure = new Pressure();
      if (values[1] === 'A') {
        pressure.value = parseInt(values[2])/100;
        pressure.unit = 'Hg';
      } else {
        pressure.value = parseInt(values[2]);
        pressure.unit = 'mb';
      }
      this.metar.pressure = pressure;

      this.next();
    }
    return this;
  }

  parseRemark() {
    // TODO: Add remark parsing
    return this;
  }

  parseQcFlag() {
    if (this.raw[this.raw.length - 1] === '$') {
      this.metar.qcFlag = true;
    }
    return this;
  }

  parse() {
    this.tokens = this.raw
      .split(TOKEN_SEPARATOR)
      .map((val) => {
        return val.trim();
      })
      .filter((val) => {
        return !!val;
      });


    this.parseType()
      .parseStationIdentifier()
      .parseDateAndTime()
      .parseModifier()
      .parseWind()
      .parseCavok()
      .parseVisibility()
      .parseRunwayVisualRange()
      .parsePresentWeather()
      .parseSkyCondition()
      .parseTempAndDewPoint()
      .parsePressure()
      .parseRemark()
      .parseQcFlag();
  }
}

function parse(data, date) {
  data = data.trim();
  if (data) {
      try {
        let metarParser = new MetarParser(data, date);

        metarParser.parse();
        return metarParser.metar.toHumanFriendly();
      } catch (err) {
        logger.error(err);
        if (err instanceof MetarParserError) {
          throw err;
        } else {
          throw new MetarParserError('Metar Parser failed to parse data: '+data);
        }
      }
  } else {
    throw new MetarParserError('Invalid Metar data: '+data);
  }
}

module.exports = {
  parse: parse,
};
