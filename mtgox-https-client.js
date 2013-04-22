var querystring = require('querystring'),
        https = require('https'),
        jsSHA = require('./lib/jsSHA/src/sha_dev.js');

function MtGoxClient(key, secret) {
        this.key = key;
        this.secret = secret;
}
 
MtGoxClient.prototype.query = function(path, args, callback) {
        var client = this;
 
        // if no args or invalid args provided, just reset the arg object
        if (typeof args != "object") args = {};
 
        // generate a nonce
        args['nonce'] = (new Date()).getTime() * 1000;
        // compute the post data
        var post = querystring.stringify(args);
        // append the path to the post data
        var message = path + "\0" + post;
        // create a new instance of the jsSHA object with our message
        var shaObj = new jsSHA.jsSHA(message, "TEXT");
        // Decode the API secret using Base64
        // Perform the HMAC algorithm using SHA-512 for the encryption method
        // Encode the result using Base 64
        var hmac = shaObj.getHMAC(client.secret, "B64", "SHA-512", "B64");

        // this is our query
        var options = {
                host: 'data.mtgox.com',
                path: '/api/2/' + path,
                method: 'POST',
                agent: false,
                headers: {
                        'Rest-Key': client.key,
                        'Rest-Sign': hmac,
                        'User-Agent': 'Mozilla/4.0 (compatible; MtGox node.js client)',
                        'Content-type': 'application/x-www-form-urlencoded',
                        'Content-Length': post.length
                }
        };
 
        // run the query, buffer the data and call the callback
        var req = https.request(options, function(res) {
                res.setEncoding('utf8');
                var buffer = '';
                res.on('data', function(data) { buffer += data; });
                res.on('end', function() { if (typeof callback == "function") { callback(JSON.parse(buffer)); } });
        });
 
        // basic error management
        req.on('error', function(e) {
                console.log('warning: problem with request: ' + e.message);
        });
 
        // post the data
        req.write(post);
        req.end();
};
 
var client = new MtGoxClient('', '');
client.query('money/wallet/history', {"currency":"BTC"}, function(json) {
        // output the json history object 
        console.log(json);
        // output the transactions
        json.data.result.forEach(function(transaction) {
                console.log(transaction);
        });
});