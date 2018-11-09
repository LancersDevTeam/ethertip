const express = require('express');
const serverlessExpress = require('aws-serverless-express/middleware');
const bodyParser = require('body-parser');

module.exports = function(controller) {
    var webserver = express();

    // Add as middleware
    webserver.use(serverlessExpress.eventContext());

    webserver.use(bodyParser.json());
    webserver.use(bodyParser.urlencoded({ extended: true }));

    // import all the pre-defined routes that are present in /components/routes
    var normalizedPath = require("path").join(__dirname, "routes");
    require("fs").readdirSync(normalizedPath).forEach( function(file) {
        require(__dirname + '/routes/' + file)(webserver, controller);
    });

    controller.webserver = webserver;

    return webserver;
}
