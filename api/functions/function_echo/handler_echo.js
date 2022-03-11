module.exports.echo = function (event, context, callback) {
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

    logger.info('Invoking echo user');

    var userMessage = '';
    if (event.body !== null && event.body !== undefined) {
        let payload = event.body;

        if (payload.message == null || payload.message == undefined) {
            var error = new Error("Message is missing.")
            callback(error);
        }

        userMessage = payload;
        logger.debug('Processing %s', userMessage.message);

        var response = { "echo": userMessage.message }

        callback(null, response);
    }
}