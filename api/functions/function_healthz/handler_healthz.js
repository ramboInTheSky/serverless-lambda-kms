'use strict';

module.exports.healthz = function (event, context, callback) {

    const { createLogger, format, transports } = require('winston');

    const logger = createLogger({
      level: 'debug',
      format: format.combine(
        format.splat(),
        format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss'
        }),
        format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
      ),
      transports: [new transports.Console()]
    });

    logger.info('Invoking the healthcheck function');

    callback(null, {});
};
