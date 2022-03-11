'use strict';

var httpClient = require('https');
var querystring = require('querystring');
var AWS = require('aws-sdk');

module.exports.changelog = function (event, context, callback) {

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

    logger.info('Invoking Changelog function');

    if (process.env.ENABLE_CHANGELOG) {
        var sns = new AWS.SNS({apiVersion: '2010-03-31'});

        // Local harness
        if (process.env.IS_OFFLINE !== undefined && process.env.IS_OFFLINE === true) {
            var subParams = {
                Protocol:                 'http',
                TopicArn:                 process.env.CHANGELOG_TOPIC,
                Attributes:               {},
                Endpoint:                 process.env.CHANGELOG_SUBSCRIPTION_ENDPOINT,
                ReturnSubscriptionArn:    true || false
            };
            sns.subscribe(subParams, function(err, data) {
                if (err) console.log(err, err.stack);
                else     console.log(data);
            });
        }

        let payload = event.Records[0].body;

        console.info('Changelog event: %s', payload);

        let uuid                    = JSON.parse(payload).uuid;
        let credentials             = process.env.POLICYGATE_SERVICE_CLIENT_ID + ':' + process.env.POLICYGATE_SERVICE_CLIENT_SECRET;
        let profileConnectHost      = process.env.PROFILECONNECT_HOST;
        let profileConnectEndpoint  = process.env.PROFILECONNECT_PROFILE_ENDPOINT + uuid;
        let changelogTopic          = process.env.CHANGELOG_TOPIC;
        let changelogSubscription   = process.env.CHANGELOG_SUBSCRIPTION_ENDPOINT;
        let webhook_hash            = process.env.CHANGELOG_WEBHOOK_HASH;

        var tokenRequestOptions = {
            method:     'POST',
            host:       process.env.POLICYGATE_HOST,
            path:       process.env.POLICYGATE_TOKEN_ENDPOINT,
            headers:    {
                            'Authorization':    'Basic ' + Buffer.from(credentials).toString('base64'),
                            'Content-Type':     'application/x-www-form-urlencoded'
                        }
        };

        var tokenRequestPayload = querystring.stringify({
            grant_type: "client_credentials",
            scope:      "openid"
        });

        var tokenRequest = httpClient.request(tokenRequestOptions, (res => {
            var tokenResponse = '';
            res.setEncoding('utf8');
            res.on('data', (result) => {
                tokenResponse += result;
            });

            res.on('error', function(e) {
                logger.warn('Encountered an error: %s', e.message);
                var response = {
                    statusCode: 500,
                    body:       e.message
                };
                callback(null, response);
            });

            res.on('end', function (params) {
                var token = JSON.parse(tokenResponse);
                if (token.access_token != undefined) {
                    var getUserProfileRequestOptions = {
                        method:     'GET',
                        host:       profileConnectHost,
                        path:       profileConnectEndpoint,
                        headers:    {
                                        'Content-Type': 'application/json',
                                        'Authorization' : 'Bearer ' + token.access_token
                                    }
                    };

                    var getUserProfileRequest = httpClient.request(getUserProfileRequestOptions, (res => {
                        var getUserProfileResponse = '';
                        res.setEncoding('utf8');
                        res.on('data', (result) => {
                            getUserProfileResponse += result;
                        });

                        res.on('error', (e) => {
                            logger.warn('Encountered an error: %s', e.message);
                            var response = {
                                statusCode: 500,
                                body:       e.message
                            };
                        });

                        res.on('end', () => {
                            var profile = JSON.parse(getUserProfileResponse).data;

                            if (profile !== undefined && profile.sub !== undefined) {
                                var address = {
                                    postal_code:    profile.address !== undefined ? profile.address.postal_code : null,
                                    country:        profile.address !== undefined ? profile.address.country : null,
                                }

                                var idamIdProfile = {
                                    hash:               webhook_hash,
                                    sub:                profile.sub,
                                    family_name:        profile.family_name,
                                    given_name:         profile.given_name,
                                    birthdate:          profile.birthdate,
                                    email:              profile.email,
                                    email_verified:     profile.email_verified,
                                    address:            address,
                                    mobileNumber:       profile.mobileNumber,
                                    optIn:              profile.optIn,
                                    termsAndConditions: profile.termsAndConditions,
                                    idp_iam_id:         profile.idp_iam_id,
                                    paytronix_iam_id:   profile.paytronix_iam_id,
                                    updated_at:         new Date(profile.updated_at * 1000).toISOString()
                                };

                                logger.info("Nando's ID profile: %s", JSON.stringify(idamIdProfile));

                                var sns = new AWS.SNS({apiVersion: '2010-03-31'});
                                let messageData = {
                                    Message:            JSON.stringify(idamIdProfile),
                                    MessageStructure:   'string',
                                    TopicArn:           changelogTopic
                                };
                                try {
                                    logger.warn("Publish the event [%s] to the changelog topic [%s]", JSON.stringify(messageData), changelogTopic);
                                    sns.publish(messageData).promise();
                                } catch (err) {
                                    logger.warn("Failed to publish to the changelog topic: %s", err);
                                }
                            } else {
                                logger.warn('Failed to retrieve the profile details for [%s]', uuid);
                            }
                        });
                    }));
                    getUserProfileRequest.end();

                } else {
                    // Send to DLQ
                    logger.warn('Error getting the user\'s profile');
                }
            });
        }));

        tokenRequest.write(tokenRequestPayload);
        tokenRequest.end();
    }

    callback(null, { result: 'ok'});
}
