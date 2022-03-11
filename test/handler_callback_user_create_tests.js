'use strict';

var expect = require('chai').expect;
var handler = require('../idam-api/functions/function_callback_user_create/handler_callback_user_create').callback_user_create;
var mockContext = require('mock-lambda-context');
var mockedEnv = require('mocked-env');
var Mitm = require("mitm");
var Https = require("https");


describe('User creation callback', function(done) {

    let ctx;
    let restore;
    let validResponse;
    let notAllowedResponse;
    let event;

    before(() => {
        restore = mockedEnv({
            API_HOST: 'idamid-api',
            CALLBACK_ENDPOINT: '/callback',
            CALLBACK_HASH: 'CALLBACK_HASH'
        });

        validResponse = {
            "status": "ok"
        };

        notAllowedResponse = {
            status: "Invalid hash"
        };

        event = {
            body:
                [
                    {
                        uuid: "UUID",
                        entity_type: "user",
                        datetime: "DATE_TIME",
                        hash: "CALLBACK_HASH",
                        client_id: "CLIENT_ID"
                    }
                ]
        };
        ctx = new mockContext();
    });

    beforeEach(() => {
        console.log('=======================');
        console.log('before each event fired');
        console.log('=======================');
        var mitm = Mitm();

        mitm.on("request", function(req, res) {
            res.statusCode = 200
            res.end(JSON.stringify(validResponse));
        });

        Https.get('https://' + restore.API_HOST + restore.CALLBACK_ENDPOINT, function(res) {
            res.statusCode // => 200
            res.setEncoding("utf8")
            res.on("data", console.log)
        });
    });

    it('should succeed and accept the webhook request if the hash is correct', (done) => {
        handler(event, ctx, (err, result) => {
            try {
                expect( err ).to.not.exist;
                expect(result).to.exist;
                expect(result).to.deep.equal(validResponse);
                done();
            }
            catch( error ) {
                console.log("Response: "+ JSON.stringify(validResponse));
                console.log("results :" + JSON.stringify(result));
                done( error );
            }
        });
    });

    it('should reject the webhook request if hte hash is invalid', (done) => {
        event.body[0].hash = 'INVALID_CALLBACK_HASH';

        handler(event, ctx, (err, result) => {
            try {
                expect( err ).to.exist;
                expect(result).to.exist;
                expect(result).to.deep.equal(notAllowedResponse);
                done();
            }
            catch( error ) {
                console.log("Response: "+ JSON.stringify(notAllowedResponse));
                console.log("results :" + JSON.stringify(result));
                done( error );
            }
        });
    });

    afterEach(function() {
        //reset counters
        ctx.reset();
        done = null;
    });

});
