# javascript-metar
Javascript Parser for Metar Data 

Javascript application for parsing weather data from raw metar format to human
friendly format.

Parser support the parsing of raw metar data given in format FM-15 as described
at https://math.la.asu.edu/~eric/workshop/METAR.html and in chapter-12 of the
reference document metar-format-reference.pdf included with the package.

If the raw metar data comes in some other format the parser will try its best
to parse at much data as possible.

Note:
    The current version of parser parses all the data contained in the main
    body of raw metar data and does not parse the information contained in the
    remark section.



1. Dependency

The server application has been developed in javascript using NodeJs(v7.10.1)
framework and depends on the following external package.

    a. Express [https://github.com/expressjs/express]
    b. Redis [https://github.com/NodeRedis/node_redis]
    c. Axios [https://github.com/axios/axios]

    I have used ubuntu 16.4 x86_64 for the development, but the application
    will work on any platform running nodeJs [https://nodejs.org].


2. Installing dependency

    All the external packages required for the application to work has been
    include in the package so there is no need to install it again.

    However if there is need for fresh install, then delete the folder "server/node_modules"
    and reinstall it by running command:

    npm install --production


3. Starting server

    Server can be started using any of the method given below:

        a. GO to the "server" folder and run the command given below:
            npm start
        b. Go to "server" folder and run the command given below:
            node src/index.js


4. Changing server port and redis uri

    Default server port: 8080
    Default redis uri: redis://localhost:6379

    This value can be changed by passing node environment variable
    PORT and REDIS_URI while starting the server application

    e.g.
    PORT=8000 REDIS_URI=redis://localhost:6390 node server/src/index.js

    These setting can also be changed by editing the file "server/src/config.js"

5. Application End
    /metar/ping
    /metar/info?scode=XXXX&nocache=1
