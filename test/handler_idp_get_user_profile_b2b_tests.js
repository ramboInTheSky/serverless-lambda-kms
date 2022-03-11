var expect = require('chai').expect;
var handler = require('../idam-api/functions/function_idp_get_user_profile_b2b/handler_idp_get_user_profile_b2b').idp_get_user_profile_b2b;
var mockContext = require('mock-lambda-context');
var mockedEnv = require('mocked-env');
var Mitm = require("mitm");
var Https = require("https");

describe('GET Valid IDP User Profile using B2B And Convert To Legacy Profile For Migration', function (done) {
    let ctx;
    let event;
    var userName = "test@test.com.com";
    var password = "Password1";
    let requestCount;
    let oAuthRequestCount;
    var mitm;

    before(() => {

        validResponse = {
            "idam_id": "1000480",
            "email": "testresetpassword@mailinator.com",
            "email_canonical": "testresetpassword@mailinator.com",
            "firstname": "Automation",
            "lastname": "Tester",
            "phone": "0208936757",
            "is_email_verified": true,
            "opt_in": true
        };

        legacyModel = {
            "given_name": validResponse.firstname,
            "family_name": validResponse.lastname,
            "optIn": { "status": validResponse.opt_in },
            "collection": "traditionalRegistration",
            "profile_type": "profile",
            "email": validResponse.email,
            "termsAndConditions": "true",
            "idp_iam_id": validResponse.idam_id,
            "email_verified": validResponse.is_email_verified,
            "birthdate": "12/03/1991",
            "mobileNumber": validResponse.phone
        };

        oauthTokenRequest = {
            client_id: "client",
            client_secret: "secret",
            grant_type: "password",
            username: userName,
            password: password
        };

        oauthTokenResponse = {
            access_token: "access_token",
            expires_in: 1800,
            token_type: "bearer",
            scope: null,
            refresh_token: "refresh_token"
        };

        restore = mockedEnv({
            IDENTITY_PROVIDER_HOST: 'faketestsite.idam.com',
            IDENTITY_PROVIDER_CLIENT_ID: 'client',
            IDENTITY_PROVIDER_CLIENT_SECRET: 'secret',
            IDENTITY_PROVIDER_ADMIN_USERNAME: 'testUser',
            IDENTITY_PROVIDER_ADMIN_PASSWORD: 'password',
            IDENTITY_PROVIDER_API_TOKEN_ENDPOINT: '/oauth/v2/token',
            IDENTITY_PROVIDER_API_SEARCH_USER_ENDPOINT: '/api/v1/user/search',
        });

        event = {
            body: {
                user:     userName,
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
        oAuthRequestCount = 0;
        requestCount = 0;

    });

    it('Should retry 3 times on 5xx HTTP Errors when retrieving user info', (done) => {
        mitm.on("request", function (req, res) {
            res.statusCode = 500
            if (req.url.toString().indexOf('token') > -1) {
                oAuthRequestCount++;
                res.end(JSON.stringify(oauthTokenResponse));
            }
            else if (req.url.toString().indexOf('search')) {
                res.statusCode = 500
                res.end(JSON.stringify(validResponse));
                requestCount++;
            }
            else {
                res.end(JSON.stringify(validResponse));
                requestCount++;
            }
        });

        handler(event, ctx, (err) => {
                expect(oAuthRequestCount).to.equal(3);
                expect(requestCount).to.equal(3);
                done();
        });
    }).timeout(5000);

    afterEach(function() {
        //reset counters
        ctx.reset();
        done = null;
    });
});
