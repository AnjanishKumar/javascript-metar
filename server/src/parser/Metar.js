
class Metar {
  constructor() {
    this.type = null;
    this.station = null;
    this.time = null;
    this.mod = null;
    this.wind = null;
    this.cavok = false;
    this.visibility = null;
    this.rvr = [];
    this.weather = [];
    this.sky = [];
    this.temp = null;
    this.dew = null;
    this.pressure = null;
    this.remark = [];
    this.qcFlag = false;
  }

  toHumanFriendly() {
    let data = {};
    data.type = this.type === 'SPECI' ? 'special observation' : 'regularly reported observation';
    data.station = this.station;
    data.time = this.time.toGMTString();
    if (this.mod) {
      if (this.mod === 'AUTO') {
        data.mod = 'automatic report';
      } else if (this.mod === 'COR') {
        data.mod = 'manually corrected report';
      }
    }

    if (this.wind) {
      data.wind = this.wind.toString();
    }

    if (this.cavok) {
      data['visibility'] = '10 or more km';
      data['sky'] = 'no cloud below 5000 feet';
      data['weather'] = 'no significant weather phenomena';
    }

    if (this.visibility) {
      data.visibility = this.visibility.toString();
    }

    if (this.rvr.length > 0) {
      data.rvr = this.rvr.map((rvr) => {
        return rvr.toString();
      }).join('; ');
    }

    if (this.weather.length > 0) {
      data.weather = this.weather.map((wea) => {
        return wea.toString();
      }).join('; ');
    }

    if (this.sky.length > 0) {
      data.sky = this.sky.map((sky) => {
        return sky.toString();
      }).join('; ');
    }

    if (this.temp) {
      data.temp = this.temp.toString();
    }

    if (this.dew) {
      data.dew = this.dew.toString();
    }

    if (this.pressure) {
      data.pressure = this.pressure.toString();
    }

    if (this.remark.length > 0) {
      // TODO: add support for remark
    }

    if (this.qcFlag) {
      data.qcFlag = 'Some data may be inaccurate!';
    }
    return data;
  }
}

class Wind {
  constructor() {
    this.direction = null;
    this.speed = null;
    this.unit = 'KT';
    this.guts = null;
    this.variation = {
      min: null,
      max: null,
    };
  }

  toString() {
    if (this.direction === 0 && this.speed === 0) {
      return 'Calm';
    }
    let str = '';
    if (this.direction === 'VRB') {
      str += ' variable';
    } else {
      str += 'from ' + this.direction + ' degree';
    }
    if (this.variation.min) {
      str += ' to ' + this.variation.min;
    }
    if (this.variation.max) {
      str += '-' + this.variation.max + ' degree';
    }
    str += ' at ' + this.speed + ' knots';
    if (this.guts) {
      str += ', gusting to ' + this.guts + ' knots';
    }
    return str;
  }
}

class Visibility {
  constructor() {
    this.value = null;
    this.unit = 'SM';
    this.modifier = null;
    this.low = {
      value: null,
      direction: null,
      unit: '',
    };
  }

  toString() {
    if (this.value == 9999) {
      return '10 or more km';
    }

    let str = '';
    if (this.modifier === 'M') {
      str += 'less than ';
    } else if (this.modifier === 'P') {
      str += ' more than ';
    } else {
      str += this.value;
    }
    str += ' ' + this.unit.toLocaleLowerCase();
    if (this.low.value) {
      str += ', ' + this.low.value + ' ' + this.low.unit.toLocaleLowerCase() + ' in ' + this.low.direction;
    }
    return str;
  }
}

class Pressure {
  constructor() {
    this.value = null;
    this.unit = 'Hg';
  }

  toString() {
    let str = '' + this.value;
    if (this.unit === 'Hg') {
      str += ' inches';
    }
    str += ' ' + this.unit;
    return str;
  }
}

class Temperature {
  constructor() {
    this.value = null;
    this.unit = 'C';
    this.modifier = null;
  }

  toString() {
    let str = '';
    if (this.modifier === 'M') {
      str += '-';
    }
    return str+ this.value + ' degree celsius';
  }
}

const SKY_CONDITION = {
  VV: 'Vertical visibility',
  SKC: 'Clear',
  CLR: 'Clear',
  FEW: 'Few clouds',
  SCT: 'Scattered clouds',
  BKN: 'Broken clouds',
  OVC: 'Overcast clouds',
  NSC: 'no significant cloud',

};

const OPTIONAL_SKY_CONDITION = {
  CU: 'cumulus',
  CB: 'Cumulonimbus',
  TCU: 'Towering Cumulus',
  CI: 'cirrus',
};

class Sky {
  constructor() {
    this.cover = null;
    this.height = null;
    this.unit = 'FT';
    this.suffix = null;
  }

  toString() {
    let str = SKY_CONDITION[this.cover];
    if (this.cover === 'CLR' || this.cover === 'SKC' ||this.cover === 'NSC') {
      return str;
    }

    if (this.height) {
      if (this.height === '///') {
        str += ' below station level';
      } else {
        str += ' at ' + this.height * 100 + ' feet';
      }
    }

    if (this.suffix) {
      str += ' with ' +OPTIONAL_SKY_CONDITION[this.suffix];
    }
    return str;
  }
}

const WEATHER_ABBR = {};
WEATHER_ABBR.INTENSITY = {};
WEATHER_ABBR.INTENSITY['+'] = 'Heavy';
WEATHER_ABBR.INTENSITY['-'] = 'Light';
WEATHER_ABBR.INTENSITY['VC'] = 'In the vicinity';
WEATHER_ABBR.DESCRIPTOR = {
  MI: 'Shallow',
  PR: 'Partial',
  BC: 'Patches',
  DR: 'Low Drifting',
  BL: 'Blowing',
  SH: 'Shower(s)',
  TS: 'Thunderstorm',
  FZ: 'Freezing',
};
WEATHER_ABBR.PHENOMENA = {
  // precipitation group
  DZ: 'Drizzle',
  RA: 'Rain',
  SN: 'Snow',
  SG: 'Snow Grains',
  IC: 'Ice Crystals',
  PL: 'Ice Pellets',
  GR: 'Hail',
  GS: 'Small Hail and/or Snow Pellets',
  UP: 'Unknown Precipitation',
  // obscuration group
  BR: 'Mist',
  FG: 'Fog',
  FU: 'Smoke',
  VA: 'Volcanic Ash',
  DU: 'Widespread Dust',
  SA: 'Sand',
  HZ: 'Haze',
  PY: 'Spray',
  // misc group
  PO: 'Well Developed Dust/Sand Whirls',
  SQ: 'Squalls',
  FC: 'Funnel Cloud Tornado Waterspout',
  SS: 'Sandstorm',
  DS: 'Duststorm',
};

class Weather {
  constructor() {
    this.intensity = '';
    this.descriptor = null;
    this.phenomena = null;
  }

  toString() {
    let str = '';
    if (this.intensity) {
      str += WEATHER_ABBR.INTENSITY[this.intensity];
    }
    if (this.descriptor) {
      str += ' ' + WEATHER_ABBR.DESCRIPTOR[this.descriptor];
    }
    if (this.phenomena) {
      str += ' '+ WEATHER_ABBR.PHENOMENA[this.phenomena];
    }
    return str;
  }
}


class Rvr {
  constructor() {
    this.runway_no= null;
    this.approach_direction = null;
    this.visibility = {
      min: {
        value: null,
        modifier: '',
        unit: 'FT',
      },
      max: {
        value: null,
        modifier: '',
        unit: 'FT',
      },
    };
  }

  toString() {
    let str = 'On runway ' + this.runway_no;
    if (this.approach_direction) {
      str += this.approach_direction;
    }
    if (this.visibility.min.value) {
      if (this.visibility.min.modifier === 'M') {
        str += ' less than';
      } else if (this.visibility.min.modifier === 'P') {
        str += ' more than';
      }
      str += ' ' + this.visibility.min.value + ' feet';
    }
    if (this.visibility.max.value) {
      str += ' and';
      if (this.visibility.max.modifier === 'M') {
        str += ' less than';
      } else if (this.visibility.max.modifier === 'P') {
        str += ' more than';
      }
      str += ' ' + this.visibility.max.value + ' feet';
    }
    return str;
  }
}

module.exports = {
  Metar,
  Wind,
  Visibility,
  Pressure,
  Temperature,
  Sky,
  Weather,
  Rvr,
};
