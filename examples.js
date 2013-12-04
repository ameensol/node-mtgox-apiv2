var MtGoxClient = require("./mtgox");

var client = new MtGoxClient("my_key", "my_secret");

client.info(function(err, json) {
    if (err) { throw err; }
    console.log("---------------Client Info:--------------");
    console.log(json);
});

client.idKey(function(err, json) {
    if (err) { throw err; }
    console.log("---------------Client Id Key:--------------");
    console.log(json);
});

client.orders(function(err, json) {
    if (err) { throw err; }
    console.log("---------------Client Orders:--------------");
    console.log(json);
});

client.currency(function(err, json) {
    if (err) { throw err; }
    console.log("---------------Currency:--------------");
    console.log(json);
});

client.ticker(function(err, json) {
    if (err) { throw err; }
    console.log("---------------Ticker:--------------");
    console.log(json);;
});

client.tickerFast(function(err, json) {
    if (err) { throw err; }
    console.log("---------------Fast Ticker:--------------");
    console.log(json);
});

client.quote("ask", 100000000, function(err, json) {
    if (err) { throw err; }
    console.log("---------------Quote:--------------");
    console.log(json);
});

// Will place a bid for 1 bitcoin at a price of 1 dollar,
// Commented for your protection
// client.add("bid", "1", "1", function(err, json) {
//     if (err) { throw err; }
//     console.log("---------------Add:--------------");
//     console.log(json);
// }); 

// Will send 0.01 bitcoins to bitcoinAddress with a 0.0001 btc fee.
// Commented for your protection
// var bitcoinAddress = '<your bitcoin address here>';
// client.sendBitcoin(bitcoinAddress, 0.01, 0.0001, function(err, json) {
//     if (err) { throw err; }
//     console.log("---------------Send Bitcoins:--------------");
//     console.log(json);
// });


client.cancel("1234567890", function(err, json) {
    if (err) { throw err; }
    console.log("---------------Cancel:--------------");
    console.log(json);
});

client.lag(function(err, json) {
    if (err) { throw err; }
    console.log("---------------Lag:--------------");
    console.log(json);
});

console.log("---------------Fetch Trades:--------------");
var trades = client.fetchTrades()
trades.on("data", function (json) {
  console.log(json);
});
trades.on("error", function (error) {
  console.log(error);
});

client.fetchDepth(function(err, json) {
    if (err) { throw err; }
    console.log("---------------Fetch Depth:--------------");
    json.data.asks.forEach(function(el) {
        console.log(el);
    });
});

client.fullDepth(function(err, json) {
    if (err) { throw err; }
    console.log("---------------Full Depth:--------------");
    json.data.asks.forEach(function(el) {
        console.log(el);
    });
});

client.history("USD", null, function(err, json) {
    if (err) { throw err; }
    console.log("---------------History:--------------");
    json.data.result.forEach(function(el) {
        console.log(el);
    });
});

client.depositAddress(function(err, json) {
    if (err) { throw err; }
    console.log("---------------Deposit Address:--------------");
    console.log(json);
});
