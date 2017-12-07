# Javascript Parser for Metar Data 

Javascript application for parsing weather data from raw metar format to human
friendly format.

Parser support the parsing of raw metar data given in format FM-15 as described
at https://math.la.asu.edu/~eric/workshop/METAR.html and in chapter-12 of the
reference document metar-format-reference.pdf included with the package.

If the raw metar data comes in some other format the parser will try its best
to parse at much data as possible.

**Note:**
    The current version of parser parses all the data contained in the main
    body of raw metar data and does not parse the information contained in the
    remark section.


## Usage
Install dependencies
```
$ npm install
```

For development
```bash
$ npm run dev
```

For production
```bash
$ npm start
```

## Changing server port and redis uri

    Default server port: 8080
    Default redis uri: redis://localhost:6379

    This value can be changed by passing node environment variable
    PORT and REDIS_URI while starting the server application

    e.g.
    PORT=8000 REDIS_URI=redis://localhost:6390 node server/src/index.js

    These setting can also be changed by editing the file "server/src/config.js"

## Application End Point
```
	-/metar/ping
    -/metar/info?scode=XXXX&nocache=1
```
