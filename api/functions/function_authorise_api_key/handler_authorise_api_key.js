'use strict';

module.exports.authorise_apikey = function (event, context, callback) {

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

    logger.debug('Check API key');

    var requestKey =  null;
    var regex = /^APIKEY (.*)$/;

    if (event.authorizationToken !== null && event.authorizationToken !== undefined && event.authorizationToken.match(regex)) {
        requestKey = event.authorizationToken.toString().split(' ')[1];
    }

    var authResponse = {
        'principalId': requestKey,
        'policyDocument': {
            'Version': '2012-10-17',
            'Statement': [{
                'Action': 'execute-api:Invoke',
                'Effect': (requestKey === process.env.IDAM_ID_API_KEY) ? 'Allow' : 'Deny',
                'Resource': event.methodArn
            }]
        }
    };

    callback(null, authResponse);
};