# Serverless functions

This repository contains all the configuration files to deploy the IDP API onto AWS Lambda and expose them via AWS API Gateway.
We use the [Serverless Framework](https://serverless.com/framework) to deploy the contents of this repository

## Structure
The directory structure has been designed to keep everything simple and deployable into a single API Gateway.

```
api
    +-- api
    |   +-- functions
    |   |   +-- function_<description>
    |   |       +-- handler.js          # Lambda Code Handler
    |   +-- stage_variables
    |       +-- ci.yaml                 # Stage specific variables
    |       +-- dev.yaml                # eg. vars related to dev environment
    +-- serverless.yaml                 # Serverless deployment file
```


## Setup

### Prerequisites

This project requires the following;
* nodejs
* npm
* serverless framework
* AWS credential token

### Node.js and npm

Simply download and install [nodejs](https://nodejs.org/en/download/package-manager/) and [npm](https://www.npmjs.com/get-npm)

_On macOS, it is recommended to use [homebrew](https://brew.sh/) for this_

### Serverless Framework

Once npm is installed, install serverless npm package with

`npm install -g serverless`

This repository requires some additional plugins to be installed, which is done from the `package.json` with the following

`npm install`

### AWS Credential token

Now the tools are installed, serverless needs to hook up to AWS with credentials

1. Head to the [IAM Console](https://console.aws.amazon.com/iam/home)
1. Find your username in the list
1. Click on the "Security credentials" tab
1. Click the "Create access key" button
1. Copy the "Access Key ID" and store that as an environment variable `AWS_ACCESS_KEY_ID`
1. Click "show" and copy the "Secret access key" and store that as an environment variable `AWS_SECRET_ACCESS_KEY`

## Adding a new endpoint

1. Create a new function directory under `functions/` as `function_<description>`
1. Add a handler inside the new directory. This is your Lambda code
1. Add the new handler to the `serverless.yaml` file as descibed below

```yaml
functions:
 hello:                                                     # Function name
   handler: functions/function_hello/handler_hello.hello    # Path to the handler when deployed to Lambda
   package:
     include:
     - functions/function_hello/*                           # Files glob to include in the deployed package
   events:
   - http: get hello                                        # API Endpoint
```

In this snippet, we are adding a Lambda function named `hello` and exposing it via a GET endpoint on `/hello`.

## Stage Environments

To reference a stage-specific variable in a deployment, first make sure that the variable is defined in all stage yaml files.
Then use the following syntax to reference it.

`${self:custom.<var_name>}`

##### Example

`API_KEY: ${self:custom.serviceApiKey}`

## Testing

There are two methods for testing locally;

###  Run this project locally

To fully test the integration between API Gateway and the Lambda function, the full deployment can be emulated using [serverless-offline](https://github.com/dherault/serverless-offline). In addition to that, we use docker to emulate AWS SQS for local development.

* Install plugins via NPM: `npm install`
* Install Docker engine
* Run `cd ./start.sh` from inside api/

#### Monitor the queues
* Use sqs-insights
* Configure the endpoints in config/config.json:
```json
{
    "port": 3003,
    "rememberMessages": 100,

    "endpoints": [
        {
            "region": "eu-west-2",
            "url": "http://localhost:9324/queue/newuser"
        }
    ]
}
```

This will serve the full project locally on port `:3000` via an API gateway so GET and POST requests are required to access the functions pulling the settings from the `local` stage.

### API Documentation

The documentation is based on the Serverless AWS Documentation plugin 
