var expect = require('chai').expect;
var handler = require('../idam-api/functions/function_idp_search/handler_idp_search').idp_search;
var mockContext = require('mock-lambda-context');
var mockedEnv = require('mocked-env');
var Mitm = require("mitm");
var Https = require("https");

describe('GET Search for IDP User Profile by email address', function (done) {
    let ctx;
    let restore;
    let event;
    var userName = "test@test.com.com";
    var password = "Password1";
    let response;
    let oAuthRequestCount;
    let requestCount;
    var mitm;

    before(() => {

        oauthTokenResponse = {
            "access_token": "OWBY7jutzkMwrWVZodfGKJc3idHEWqOt_zAjbc0iLQ",
            "expires_in": 1800,
            "refresh_token": "SBlT3CkCJIt9sPi5VacQpv6k_IT2T0gA3Eyw3oXhxb",
            "scope": "user_read account_read user_write account_write",
            "token_type": "bearer",
            "username": "efthymios.kartsonakis@amido.com",
            "result": "success"
        };


        restore = mockedEnv({
            IDENTITY_PROVIDER_HOST: 'faketestsite.idam.com',
            IDENTITY_PROVIDER_CLIENT_ID: '123',
            IDENTITY_PROVIDER_CLIENT_SECRET: 'GBAyfVL7YWtP6gudLIjbRZV_N0dW4f3xETiIxqtokEAZ6FAsBtgyIq0MpU1uQ7J08xOTO2zwP0OuO3pMVAUTid',
            IDENTITY_PROVIDER_ADMIN_USERNAME: 'testUser',
            IDENTITY_PROVIDER_ADMIN_PASSWORD: 'password',
            IDENTITY_PROVIDER_API_TOKEN_ENDPOINT: '/rest/19.2/oauth/requestGuestToken.json',
            IDENTITY_PROVIDER_API_SEARCH_USER_ENDPOINT: '/rest/19.2/guest/userInformation.json',

        });

        validResponse = {
            "result": "success",
            "accountIds": [
                213736109
            ],
            "addresses": [
                {
                    "address1": "148 Upper Richmond Rd",
                    "address2": "A Building",
                    "addressId": 213736113,
                    "city": "London",
                    "country": "GB",
                    "label": "Primary Address",
                    "postalCode": "SW152SW"
                },
                {
                    "address1": "1-5 Bond St",
                    "address2": "B Building",
                    "addressId": 213791867,
                    "city": "London",
                    "country": "GB",
                    "label": "Address 2 Test",
                    "postalCode": "W5 5AP"
                }
            ],
            "fields": {
                "address1": "148 Upper Richmond Rd",
                "address2": "A Building",
                "addressLabel": "Primary Address",
                "city": "London",
                "country": "GB",
                "email": "email@test.com",
                "emailVerified": false,
                "firstName": "testFirstName",
                "lastName": "testLastName",
                "mobilePhone": "01234567890",
                "optIn": true,
                "postalCode": "SW152SW",
                "smsOptInVerified": false,
                "textCampaignOptIn": false,
                "username": "username@test.com"
            },
            "primaryCardNumbers": [
                "9990016421"
            ]
        };

        event = {
            body: {
                user: userName,
                password: password
            }
        };

    });

    beforeEach(function () {
        console.log('======================');
        console.log('before each event fired');
        console.log('=====================');
        ctx = new mockContext();
        mitm = Mitm();
        requestCount = 0;
        oAuthRequestCount = 0;

    });


    it('Should retry 3 times on 5xx HTTP Errors when retreving user info', (done) => {
        mitm.on("request", function (req, res) {
            res.statusCode = 200

            if (req.url.toString().indexOf('requestGuestToken') > -1) {
                oAuthRequestCount++;
                console.log('Token request count ' + oAuthRequestCount);
                res.end(JSON.stringify(oauthTokenResponse));

            } else if (req.url.toString().indexOf('oauth')) {
                res.statusCode = 500
                requestCount++;
                console.log('Request count ' + requestCount);
                res.end(JSON.stringify(response));
            }

        });
        response = {};

        handler(event, ctx, (err) => {
            expect(oAuthRequestCount).to.equal(1);
            expect(requestCount).to.equal(3);
            done();
        });
    }).timeout(3000);

    it('should find user and return true', (done) => {
        mitm.on("request", function (req, res) {
            res.statusCode = 200
            
            if (req.url.toString().indexOf('requestGuestToken') > -1) {
                console.log('Token request count ' + oAuthRequestCount);
                res.end(JSON.stringify(oauthTokenResponse));

            } else if (req.url.toString().indexOf('oauth')) {
                console.log('Request count ' + requestCount);
                res.end(JSON.stringify(response));
            }

        });
        response = validResponse;

        handler(event, ctx, (err, result) => {
            try {
                expect(err).to.not.exist;
                expect(result).to.exist;
                expect(result.exists).to.equal(true);
                done();
            }
            catch (error) {
                console.log("Expected Result : " + JSON.stringify(apiResponse));
                console.log("  Actual Result : " + JSON.stringify(result));
                done(error);
            }
        });
    }).timeout(3000);

});