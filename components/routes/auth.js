const Web3Utils = require('web3-utils');
const util = require("ethereumjs-util");
const request = require('sync-request');
const signerPrivKey = util.toBuffer(process.env.PRIV_KEY);

const Web3 = require('web3');
const web3 = new Web3("https://rinkeby.infura.io");

module.exports = function(webserver, controller) {
    webserver.use(function(req, res, next) {
        next();
    });

    webserver.post('/add', function (req, res) {
        // Activate CORS on lambda side
        res.set({
            'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
            'Access-Control-Allow-Methods': 'DELETE,GET,HEAD,OPTIONS,PATCH,POST,PUT',
            'Access-Control-Allow-Credentials': 'true',
            'Access-Control-Allow-Origin': '*'
        });

        var identity = req.body.identity;
        var claimType = req.body.claimType;
        var id = req.body.id;
        var pass = req.body.pass;
        // if you need Authentication, Please add below

        //change below condition to check returned value
        if(1==1){
            var rawData = req.body.id;
            var hexData = Web3Utils.asciiToHex(rawData);
            var hash = Web3Utils.soliditySha3(identity ,claimType,hexData);

            var hashPersonalMessage = util.hashPersonalMessage(util.toBuffer(hash));
            var result = util.ecsign(hashPersonalMessage, signerPrivKey);
            var result_r = util.bufferToHex(result.r);
            var result_s = util.bufferToHex(result.s).slice(2);
            var result_v = util.bufferToHex(result.v).slice(2);

            var sig = result_r + result_s + result_v;

            res.json(
                {
                    sig: sig,
                    data: hexData,
                    status: true
                }
            );

        } else {
            res.json(
                {
                    status: false,
                }
            );
        }
    });
    webserver.listen(3000, function () {
        console.log('app listening on port 3000!')
    });

}
