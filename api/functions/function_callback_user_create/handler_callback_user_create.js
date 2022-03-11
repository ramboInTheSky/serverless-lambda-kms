'use strict';

var httpsClient = require('https');

var httpClient;
if (process.env.IS_OFFLINE !== undefined && process.env.IS_OFFLINE === true) {
    httpClient = require('http');
} else {
    httpClient = httpsClient;
}
var AWS = require('aws-sdk');

module.exports.callback_user_create = function (event, context, callback) {

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

    logger.info('Invoking Janrain Callback for User Create function');

    var inputUser = '';
    if (event.body !== null && event.body !== undefined) {
        inputUser = event.body;

        if (process.env.CALLBACK_HASH !== inputUser[0].hash) {
            callback("[403]", {status : "Invalid hash"});
        } else {
            var sqs = new AWS.SQS();

            let payload = {
                uuid:     inputUser[0].uuid,
                datetime: inputUser[0].datetime
            };

            var params = {
                MessageBody: JSON.stringify(payload),
                QueueUrl: process.env.CHANGELOG_QUEUE_URL
            };

            sqs.sendMessage(params, function(err, data) {
                if (err) {
                    logger.error('Error encountered sending a message to process user creation to [%s]: [%s]', params.QueueUrl, err);
                } else {
                    logger.debug('User creation event sent to %s queue', process.env.CHANGELOG_QUEUE_URL);
                }
            });

            callback(null, {status : "ok"});
        }

    }

};
