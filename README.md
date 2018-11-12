# Ethertip
This is ether tipping system on Slack. Using ERC725/ERC735 for Authentication.

##  Abstract
Ethertip is a service that enables tip using Ethereum on Slack.  
Diagram is shown below.
![ethertip_architecture](https://user-images.githubusercontent.com/42530222/47830338-d452d580-ddce-11e8-88d2-7dafb8ce62f7.png)

## Install
### local
Clone this repository.
Run `npm install` command to reproduce the contents of package.json.  
It can be run locally with `npm run start`.

### AWS
**IAM User**  
Attach these Authorities to IAM User.
- AWSLambdaFullAccess
- AmazonS3FullAccess
- AmazonDynamoDBFullAccess
- AmazonAPIGatewayAdministrator
- AWSKeyManagementServicePowerUser

After Attach Authorities, generate an access key.

**IAM Role**  
Attach these Authorities to IAM Role.
- AmazonDynamoDBFullAccess
- CloudWatchLogsFullAccess
- AmazonAPIGatewayAdministrator
- AWSLambdaBasicExecutionRole
- AWSKeyManagementServicePowerUser

#### Lambda
To upload to Lambda you need to zip file. At that time, static folder supposed to be hosted at S3, so exclude them.

But, A file larger than 10 MB can't directly upload in Lambda. So, After placing it on S3 once, upload to Lambda.

Change the URL in the part defining the `/withdraw` command in app.js.
```
bot.replyPublic(message,"You can withdraw your ether to " + user.address + " at below: " +
                    "https://static_file_URL_on_S3/withdraw.html?id=" + message.user +
                    "&value=" + user.tip +
                    "&sig=" + sig);
```

Execute the following command to zip it。  
`zip -r ../example.zip *`

Build a bucket with an appropriate name in S3 and upload the zipped file.

Create Lambda function.

#### Environment variable
-   clientId : Slackapp clientId
-   clientSecret : Slackapp clientSecret
-   PORT: localhost port number
-   EXPRESS_AWS_REGION : AWS resion
-   EXPRESS_AWS_ACCESS_KEY_ID : IAM user access key
-   EXPRESS_AWS_SECRET_ACCESS_KEY: IAM user secret access key
-   PRIV_KEY : contract secret key

#### API Gateway

**Add Method**
- method : ANY  
Integration type : Lambda function  
Check `Use Lambda integrated proxy`
Set up the created Lambda function

- method : OPTIONS  
Select `Mock`.

**Add resource**  
Choose `Set as proxy resource` from `Create Resource`.
Check `Activate API Gateway CORS`.

<img width="1089" alt="api_gateway" src="https://user-images.githubusercontent.com/42530222/47829257-c6e71c80-ddc9-11e8-8a39-b78c2e3b9091.png">

**Deploy**  
If all setting is completed, Deploy the API from `action`.

#### DynamoDB
Create a table named `botkit` from `table creation`.  
Primary partition key: type (String)  
Primary sort key: id (String)  

#### Set static files to S3
Upload static files in `static` folder to S3.
Before that, change url in add() function to endpoint of API Gateway.

```
function add() {
    userRegistoryInstance.users(userAccount, function (err, result) {
        $.ajax({
            method: 'POST',
            url: 'https://API Gateway_Endpoint_URL' + 'add',
```

### Slack
- Create App
[https://api.slack.com/apps/](https://api.slack.com/apps/)  

- Create a bot from `Add bot user`.

**Event**  
Request URL : https://API_Gateway_Endpoint_URL/slack/receive

Subscribe to Workspace Events
- reaction_added

**Command**  
Request URL : https://API_Gateway_Endpoint_URL/slack/receive
- /wallet : Check the wallet address and your tip status
- /register : resister wallet address
- /withdraw : Ether accumulated tip
- /withdraw : withdraw Ether accumulated tip

**OAuth & Permissions**  
Set Oauth address  
Redirect URLs : https://API_Gateway_Endpoint_URL/oauth

If all setting is completed、Install the application from "Install App".
Furthermore, In order to have Slack authentication information in botkit, access the following URL.  

`https://API_Gateway_Endpoint_URL/login`

If this is done correctly, there should be a `teams` write in DynamoDB.

## Preparation of secret key
 It is necessary to prepare two Ethereum Wallet secret keys.

### 1. Validator of Ethertip
This secret key is stored in the server of the Tip service. Wallet address associated with secret key to set to Validator tip.
When executing the Withdraw command, sign it using the secret key, restore the wallet address in the contract, query with the validator, and confirm that the signature is correct.

### 2. ClaimSigner's ID authentication
Since it is necessary to keep this secret key in the server of the authentication service, set keccak 256 of the wallet address linked to this secret key to ClaimSignerKey of ClaimIssuer.

When authenticating, sign it using the secret key, restore Keccak 256 of the wallet address in the contract, introduce it as ClaimSigner, and confirm that the signature is correct.

## Deploy contract
### Identity
1. Deploy contracts/UserRegistory.sol
2. Set the address of the deployed UserRegistory as the parameter of the constructor when deploying Identity.sol

### ClaimIssuer
1. Deploy
2. Set ClaimSigner in order to secret key

### Tip
1. Set The validator associated with the secret key to the parameter of the constructor at the time of deploy
2. Send Ether to deployed contract

### Handling with bugs and errors
Identify the part where the bug seems to come out and let it output to logs.
Logs can be checked with CloudWatch.

## How to use
- When you want to send a tip  
Send `moneybag`stamp to opponent.

- When you want to check your tip  
You can check with `/wallet` command.

- When you want to register a wallet  
`/registe your_wallet_address`

-  When you want to withdraw Ether accumulated tip  
`/withdraw`

### Withdraw Ether accumulated tip
Can withdraw with the `/withdraw` command, but you need a little preparation.

#### Install Metamask
To use Ethereum, you need a wallet address.  
Using MetaMask makes it easy to obtain addresses.  
https://metamask.io/

#### Acquire Ether on test net
You need to pay a gas fee to do transactions with Etherum. Therefore, you need to acquire Ether.  
What we're using this time is a testnet called Rinkeby.  
https://www.rinkeby.io/#stats

#### Create Identity
Create Identity from this page.
`https://static_file_URL_on_S3/register.html`
Press `Create Identity` to move to Metamask, set gas bill and press `Confirm`. (If you be stingy exaggerate gas bills, It takes time to CONFIRMED)

#### Authentication
When you generate `Identity` you will get an item to enter` Email` and `Password`. Enter an appropriate value and press `Add Claim`. Then you fly to Metamask so pay the proper gas bill and press confirmation.
When the transaction becomes `COMFIRMED`, if you click` Verify` and a green check is issued, authentication is completed.

#### Withdraw Ether accumulated tip
With authentication completed, You can withdraw the accumulated Ether from the `withdraw` button.

## LICENSE
Copyright 2018 Lancers, Inc.

Licensed under the MIT License.
