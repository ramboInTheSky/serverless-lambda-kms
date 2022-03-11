'use strict';

var expect = require('chai').expect;
var handler = require('../idam-api/functions/function_authorise_api_key/handler_authorise_api_key').authorise_apikey;
var mockContext = require('mock-lambda-context');
var mockedEnv = require('mocked-env');

describe('Get authorisation response by api key', (done) => {

    let ctx;
    let restore;
    let event;
    let validAuthResponse;
    let invalidAuthResponse;
    const methodArn = '/test/fakeendpoint';
    const apiKey = 'FAKE_API_KEY_1234567890';

    before(() =>{
        restore = mockedEnv({
            IDAM_ID_API_KEY: apiKey.toString()
        }); 
        
        validAuthResponse = {
            'principalId': apiKey.toString(),
            'policyDocument': {
                'Version': '2012-10-17',
                'Statement': [{
                    'Action': 'execute-api:Invoke',
                    'Effect': 'Allow',
                    'Resource': methodArn
                }]
            }
        };

        invalidAuthResponse = {
            'principalId': apiKey.toString(),
            'policyDocument': {
                'Version': '2012-10-17',
                'Statement': [{
                    'Action': 'execute-api:Invoke',
                    'Effect': 'Deny',
                    'Resource': methodArn
                }]
            }
        };
    });

    beforeEach(() =>{
        ctx = new mockContext();
        event = {
            methodArn : methodArn.toString(),
            authorizationToken : 'APIKEY '+ apiKey,
            body : {
                user: 'testusername',
                password: 'testPassword1'
            }
        };
    });

    after(() => {
        //reset counters
        ctx.reset();
    });

    it('should return an allow response with a valid api key', (done) => {
        
        var response = validAuthResponse;

        handler(event, ctx, (err, result) => {
        
            try {
                expect(err).to.not.exist;
                expect(result).to.exist;
                expect(result.principalId).to.equal(response.principalId);
                expect(result.policyDocument.Statement[0].Effect).to.equal(response.policyDocument.Statement[0].Effect);
                expect(result.policyDocument.Statement[0].Resource).to.equal(response.policyDocument.Statement[0].Resource);
                done();
            }
            catch( error ) {
                console.log("Expected Result : " + JSON.stringify(response));
                console.log("  Actual Result : " + JSON.stringify(result));
                done( error );
            }
        });
    });

    it('should return a deny response with a invalid api key', (done) => {
        
        var badKey = '1234567890_BAD_KEY';
        event.authorizationToken = 'APIKEY '+badKey;
        var response = invalidAuthResponse;
        response.principalId = badKey;

        handler(event, ctx, (err, result) => {
        
            try {
                expect(err).to.not.exist;
                expect(result).to.exist;
                expect(result.principalId).to.equal(response.principalId);
                expect(result.policyDocument.Statement[0].Effect).to.equal(response.policyDocument.Statement[0].Effect);
                expect(result.policyDocument.Statement[0].Resource).to.equal(response.policyDocument.Statement[0].Resource);
                done();
            }
            catch( error ) {
                console.log("Expected Result : " + JSON.stringify(response));
                console.log("  Actual Result : " + JSON.stringify(result));
                done( error );
            }
        });
    });

    it('should return a allow response for every request', (done) => {
        
        var response = validAuthResponse;

        for(var i = 0; i < 10; i++) {

            handler(event, ctx, (err, result) => {
            
                try {
                    expect(err).to.not.exist;
                    expect(result).to.exist;
                    expect(result.principalId).to.equal(response.principalId);
                    expect(result.policyDocument.Statement[0].Effect).to.equal(response.policyDocument.Statement[0].Effect);
                    expect(result.policyDocument.Statement[0].Resource).to.equal(response.policyDocument.Statement[0].Resource);
                }
                catch( error ) {
                    console.log("Expected Result : " + JSON.stringify(response));
                    console.log("  Actual Result : " + JSON.stringify(result));
                    
                }
            });

            if (i === 0){
                done();
            }
        }
    });
});