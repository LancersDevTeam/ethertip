/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
______     ______     ______   __  __     __     ______
/\  == \   /\  __ \   /\__  _\ /\ \/ /    /\ \   /\__  _\
\ \  __<   \ \ \/\ \  \/_/\ \/ \ \  _"-.  \ \ \  \/_/\ \/
\ \_____\  \ \_____\    \ \_\  \ \_\ \_\  \ \_\    \ \_\
\/_____/   \/_____/     \/_/   \/_/\/_/   \/_/     \/_/


This is a sample Slack bot built with Botkit.

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
require('dotenv').config();

if (!process.env.clientId || !process.env.clientSecret || !process.env.PORT) {
    console.log('Error: Specify clientId clientSecret and PORT in environment');
    process.exit(1);
}

const Botkit = require('botkit');

const bot_options = {
    clientId: process.env.clientId,
    clientSecret: process.env.clientSecret,
    debug: true,
    scopes: ['bot']
};

const dynamoStorage = require('botkit-storage-dynamodb')({
    region: process.env.EXPRESS_AWS_REGION,
    accessKeyId: process.env.EXPRESS_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.EXPRESS_AWS_SECRET_ACCESS_KEY })

bot_options.storage = dynamoStorage;

// Create the Botkit controller, which controls all instances of the bot.
var controller = Botkit.slackbot(bot_options);
controller.startTicking();

// Set up an Express-powered webserver to expose oauth and webhook endpoints
var webserver = require(__dirname + '/components/express_webserver.js')(controller);
module.exports = webserver;

// Set up a simple storage backend for keeping a record of customers
// who sign up for the app via the oauth
require(__dirname + '/components/user_registration.js')(controller);

var normalizedPath = require("path").join(__dirname, "skills");
require("fs").readdirSync(normalizedPath).forEach(function(file) {
    require("./skills/" + file)(controller);
});
