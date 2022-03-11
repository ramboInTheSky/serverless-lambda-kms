'use strict';

var expect = require('chai').expect;
var handler = require('../idam-api/functions/function_paytronix_search/handler_paytronix_search').paytronix_search;
var mockContext = require('mock-lambda-context');
var mockedEnv = require('mocked-env');
var Mitm = require("mitm");
var Https = require("https");


describe('GET Search for Paytronix User Profile by email address', function(done) {

    let ctx;
    let restore;
    let validResponse;
    let inValidResponse;
    let apiResponse;
    let event;
    var userName = "test@test.com.com";
    var password = "Password1";
    let response;

    before(() =>{

        restore = mockedEnv({
            PAYTRONIX_HOST: 'faketestsite.idam.com',
            PAYTRONIX_ADMIN_USERNAME: 'testUser',  // will be deleted from process.env
            PAYTRONIX_ADMIN_PASSWORD: 'password',
            PAYTRONIX_MERCHANT_ID: '123',
            PAYTRONIX_API_USER_ENDPOINT: '/rest/19.2/guest/userInformation.json',
            PAYTRONIX_API_USER_TOKEN_ENDPOINT: '/rest/19.2/oauth/requestGuestToken.json'
        });

        inValidResponse = {
            "result": "failure",
            "errorCode": "user_info.not_found",
            "errorMessage": "The user was not found"
        };

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
  
        apiResponse = {
            "exists": true
        };

        event = {
            body : {
                user: userName,
                password: password
            }
        };
    });

    beforeEach(function() {

        console.log('======================');
        console.log('before each event fired');
        console.log('=====================');
        ctx = new mockContext();
        var mitm = Mitm();
        
        mitm.on("request", function(req, res) {
            res.statusCode = 200
            res.end(JSON.stringify(response))
          });
          
          Https.get('https://'+restore.PAYTRONIX_API_USER_ENDPOINT +'?merchantId='+ restore.PAYTRONIX_MERCHANT_ID +'&username='+userName+'&authentication=b2b', function(res) {
            res.statusCode // => 200
            res.setEncoding("utf8")
            res.on("data", console.log) 
          });
    });

    it('should find user and return true', (done) => {
        
        response = validResponse;

        handler(event, ctx, (err, result) => {
        
            try {
                expect( err ).to.not.exist;
                expect(result).to.exist;
                expect(result.exists).to.equal(true);
                done();
            }
            catch( error ) {
                console.log("Expected Result : " + JSON.stringify(apiResponse));
                console.log("  Actual Result : " + JSON.stringify(result));
                done( error );
            }
        });
    });

    it('should not find user and return false', (done) => {
        
        response = inValidResponse;
        apiResponse.exists = false;

        handler(event, ctx, (err, result) => {
        
            try {
                expect( err ).to.not.exist;
                expect(result).to.exist;
                expect(result.exists).to.equal(false);
                done();
            }
            catch( error ) {
                console.log("Expected Result : " + JSON.stringify(apiResponse));
                console.log("  Actual Result : " + JSON.stringify(result));
                done( error );
            }
        });
    });
       
    after(function() {
        //reset counters
        ctx.reset();
    });
});