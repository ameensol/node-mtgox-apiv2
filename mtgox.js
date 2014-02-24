var querystring = require("querystring"),
  crypto = require("crypto"),
  request = require("request"),
  JSONStream = require("JSONStream");

function MtGoxClient(key, secret, currency) {
  var self = this;
  self.key = key;
  self.secret = secret;
  self._currency = currency || "BTCUSD";

  var SATOSHI_FACTOR = Math.pow(10,8);

  function makePublicRequest(path, args, callback) {
    var params = querystring.stringify(args);
    if (params) path = path + "?" + params;
    return executeRequest(basicOptions(path), callback);
  }

  function makeRequest(path, args, callback) {
    if (!self.key || !self.secret) {
      throw new Error("Must provide key and secret to make this API request.");
    }

    // generate a nonce
    args.nonce = (new Date()).getTime() * 1000;
    // compute the post data
    var postData = querystring.stringify(args);
    // append the path to the post data
    var message = path + "\0" + postData;
    // compute the sha512 signature of the message
    var hmac = crypto.createHmac("sha512", new Buffer(self.secret, "base64"));
    hmac.update(message);

    var options = basicOptions(path);

    options.method = "POST";
    options.body = postData;
    options.headers["Rest-Key"] = self.key;
    options.headers["Rest-Sign"] = hmac.digest("base64");
    options.headers["Content-Length"] = postData.length;

    return executeRequest(options, callback);
  }

  function executeRequest(options, callback) {
    if (typeof callback == "function") {
      request(options, function (err, res, body) {
        var json;
      
        if (err  || !res || res.statusCode != 200) {
          return callback(err || new Error("Request failed"));
        }

        // This try-catch handles cases where Mt.Gox returns 200 but responds with HTML,
        // causing the JSON.parse to throw
        try {
            json = JSON.parse(body);
        } catch(err) {
          if (body.indexOf("<") != -1) {
            return callback(new Error("MtGox responded with html:\n" + body));
          } else {
            return callback(new Error("JSON parse error: " + err));  
          }
        }
        
        callback(null, json);
      });
    } else {
      var parser = JSONStream.parse(["data", true]);
      request.get(options).pipe(parser);
      return parser;
    }
  }

  function basicOptions(path) {
    return {
      uri: "https://data.mtgox.com/api/2/" + path,
      agent: false,
      headers: {
        "User-Agent": "Mozilla/4.0 (compatible; MtGox node.js client)",
        "Content-type": "application/x-www-form-urlencoded"
      }
    };
  }

  self.setCurrency = function(currency) {
    self._currency = currency;
  };

  self.info = function(callback) {
    makeRequest(self._currency + "/money/info", {}, callback);
  };

  self.idKey = function(callback) {
    makeRequest(self._currency + "/money/idkey", {}, callback);
  };

  self.orders = function(callback) {
    makeRequest(self._currency + "/money/orders", {}, callback);
  };

  self.currency = function(callback) {
    makePublicRequest(self._currency + "/money/currency", {}, callback);
  };

  self.ticker = function(callback) {
    makePublicRequest(self._currency + "/money/ticker", {}, callback);
  };

  self.tickerFast = function(callback) {
    makePublicRequest(self._currency + "/money/ticker_fast", {}, callback);
  };

  self.quote = function(type, amount, callback) {
    makePublicRequest(self._currency + "/money/order/quote", {
      "type": type,
      "amount": amount
    }, callback);
  };

  // price is an optional argument, if not used it must be set to null
  self.add = function(type, amount_int, price_int, callback) {
    var args = {
      "type": type,
      "amount_int": amount_int
    };
    if (price_int) args.price_int = price_int;
    makeRequest(self._currency + "/money/order/add", args, callback);
  };

  self.cancel = function(id, callback) {
    makeRequest(self._currency + "/money/order/cancel", {
      "oid": id
    }, callback);
  };

  // not currently implemented
  self.result = function(type, order, callback) {
    makeRequest(self._currency + "/money/order/result", {
      "type": type,
      "order": order
    }, callback);
  };

  self.lag = function(callback) {
    makePublicRequest(self._currency + "/money/order/lag", {}, callback);
  };

  self.fetchTrades = function(since, callback) {
    var args = {};
    if (typeof since != undefined) args.since = since;
    return makePublicRequest(self._currency + "/money/trades/fetch", args, callback);
  };

  self.fetchDepth = function(callback) {
    makePublicRequest(self._currency + "/money/depth/fetch", {}, callback);
  };

  self.fullDepth = function(callback) {
    makePublicRequest(self._currency + "/money/depth/full", {}, callback);
  };

  // page is an optional argument, if not used it must be set to null
  self.history = function(currency, page, callback) {
    var args = { "currency": currency };
    if (page) args.page = page;
    makeRequest("money/wallet/history", args, callback);
  };

  self.sendBitcoin = function(address, amount, fee, callback) {
    var amountInt = amount * SATOSHI_FACTOR;
    var feeInt = fee * SATOSHI_FACTOR;
    var args = { address: address, amount_int: amountInt, fee_int: feeInt };
    makeRequest("money/bitcoin/send_simple", args, callback);
  };

  self.depositAddress = function(callback) {
    self.info(function(err, json) {
      if (err) return callback(err);
      if (json.result !== "success") {
        var error = new Error("Unexpected response while retrieving account number: " + json.result);
        return callback(error);
      }
      var args = { "account": json.data.Link };
      makeRequest(self._currency + "/money/bitcoin/get_address", args, callback);
    });
  }

  // More to come!
}

module.exports = MtGoxClient;
