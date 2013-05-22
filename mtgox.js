var querystring = require('querystring'),
  https = require('https'),
  crypto = require('crypto');

function MtGoxClient(key, secret, currency) {
  var self = this;
  self.key = key;
  self.secret = secret;
  self._currency = currency || 'BTCUSD';

  self.makePublicRequest = function(path, args, callback) {

    // add any arguments as a query string to the url
    if (typeof args != 'object') args = {};

    var params = querystring.stringify(args);
    if (params) path = path + '?' + params;

    // query parameters
    var options = {
      host: 'data.mtgox.com',
      path: '/api/2/' + path,
      method: 'GET',
      agent: false,
      headers: {
        'User-Agent': 'Mozilla/4.0 (compatible; MtGox node.js client)',
        'Content-type': 'application/x-www-form-urlencoded'
      }
    };

    var req = https.request(options, function(res) {
      res.setEncoding('utf8');
      var buffer = '';
      res.on('data', function(data) {
        buffer += data;
      });
      res.on('end', function() {
        if (typeof callback == 'function') {
          try {
            callback(null, JSON.parse(buffer));
          } catch (err) {
            if (buffer.indexOf('<') != -1) {
              callback(new Error('MtGox is offline'));
            } else {
              callback(err);
            }

          }
        }
      });

    });

    // basic error management
    req.on('error', function(e) {
      callback(e);
    });

    req.end();
  };

  self.makeRequest = function(path, args, callback) {

    if (!self.key || !self.secret) {
      throw 'Must provide key and secret to make this API request.';
    }

    // if no args or invalid args provided, just reset the arg object
    if (typeof args != 'object') args = {};

    // generate a nonce
    args.nonce = (new Date()).getTime() * 1000;
    // compute the post data
    var post = querystring.stringify(args);
    // append the path to the post data
    var message = path + '\0' + post;
    // compute the sha512 signature of the message
    var hmac = crypto.createHmac('sha512', new Buffer(self.secret, 'base64'));
    hmac.update(message);

    // this is our query
    var options = {
      host: 'data.mtgox.com',
      path: '/api/2/' + path,
      method: 'POST',
      agent: false,
      headers: {
        'Rest-Key': self.key,
        'Rest-Sign': hmac.digest('base64'),
        'User-Agent': 'Mozilla/4.0 (compatible; MtGox node.js client)',
        'Content-type': 'application/x-www-form-urlencoded',
        'Content-Length': post.length
      }
    };

    // run the query, buffer the data and call the callback
    var req = https.request(options, function(res) {
      res.setEncoding('utf8');
      var buffer = '';
      res.on('data', function(data) {
        buffer += data;
      });
      res.on('end', function() {
        if (typeof callback == 'function') {
          try {
            callback(null, JSON.parse(buffer));
          } catch (err) {
            callback(err);
          }
        }
      });
    });

    // basic error management
    req.on('error', function(e) {
      callback(e);
    });

    // post the data
    req.write(post);
    req.end();
  };

  self.setCurrency = function(currency) {
    self._currency = currency;
  };

  self.info = function(callback) {
    self.makeRequest(self._currency + "/money/info", {}, callback);
  };

  self.idKey = function(callback) {
    self.makeRequest(self._currency + "/money/idkey", {}, callback);
  };

  self.orders = function(callback) {
    self.makeRequest(self._currency + "/money/orders", {}, callback);
  };

  self.currency = function(callback) {
    self.makePublicRequest(self._currency + "/money/currency", {}, callback);
  };

  self.ticker = function(callback) {
    self.makePublicRequest(self._currency + "/money/ticker", {}, callback);
  };

  self.tickerFast = function(callback) {
    self.makePublicRequest(self._currency + "/money/ticker_fast", {}, callback);
  };

  self.quote = function(type, amount, callback) {
    self.makePublicRequest(self._currency + "/money/order/quote", {
      'type': type,
      'amount': amount
    }, callback);
  };

  // price is an optional argument, if not used it must be set to null
  self.add = function(type, amount, price, callback) {
    var args = {
      'type': type,
      'amount': amount
    };
    if (price) args.price = price;
    self.makeRequest(self._currency + "money/order/add", args, callback);
  };

  self.cancel = function(id, callback) {
    self.makeRequest(self._currency + "/money/order/cancel", {
      'oid': id
    }, callback);
  };

  // not currently implemented
  self.result = function(type, order, callback) {
    self.makeRequest(self._currency + "/money/order/result", {
      'type': type,
      'order': order
    }, callback);
  };

  self.lag = function(callback) {
    self.makePublicRequest(self._currency + "/money/order/lag", {}, callback);
  };

  // since is an optional argument, if not used it must be set to null
  self.fetchTrades = function(since, callback) {
    var args = {};
    if (since) args.since = since;
    self.makePublicRequest(self._currency + "/money/trades/fetch", args, callback);
  };

  self.fetchDepth = function(callback) {
    self.makePublicRequest(self._currency + "/money/depth/fetch", {}, callback);
  };

  self.fullDepth = function(callback) {
    self.makePublicRequest(self._currency + "/money/depth/full", {}, callback);
  };

  // page is an optional argument, if not used it must be set to null
  self.history = function(currency, page, callback) {
    var args = { 'currency': currency };
    if (page) args.page = page;
    self.makeRequest("money/wallet/history", args, callback);
  };

  // More to come!
}

module.exports = MtGoxClient;
