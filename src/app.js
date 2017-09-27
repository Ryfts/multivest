/* eslint-disable import/first */

import config from 'config';
import winston from 'winston';
import http from 'http';

process.on('unhandledRejection', (err) => {
    winston.error('unhandledRejection', err);

    throw err;
});

process.on('uncaughtException', (err) => {
    winston.error('uncaughtException', err);

    throw err;
});

import server from './server';
import cron from './cron';

const debug = require('debug')('ryfts:backend');

// module.parent check is required to support mocha watch
// src: https://github.com/mochajs/mocha/issues/1912
if (!module.parent) {
    // listen on port config.port
    const listenPort = config.get('listen.port');

    const httpServer = http.Server(server);

    httpServer.listen(listenPort, () => {
        winston.info(`server started on port ${listenPort}`); // eslint-disable-line no-console
    });
}
