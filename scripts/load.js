var request = require('request'),
    querystring = require('querystring'),
    Buffer = require('buffer').Buffer;

var number = process.argv[2]
  , phonePrefix = process.argv[3]
  , options = process.argv[4]
  , iterations = parseInt(process.argv[5]);

var attack = function(i) {
  var vote = Math.floor(Math.random() * options) + 1;
  var dataHash = {Body: vote, From: phonePrefix + vote + "-" + i, To: number},
      body = querystring.stringify(dataHash),
      headers = {'Content-Type': 'application/x-www-form-urlencoded'};

  request.post({uri: 'http://127.0.0.1:3000/vote/sms', headers: headers, body: body},
    function (err, response, body) {
      if (err) {
         console.log("ERROR: ", err);
      }
      else {
         console.log(body);
      }
    }
  );
};

for (var i=1; i <= iterations; i++) {
  var sleep = Math.floor((Math.random()*1000*60)+1);
  console.log("Attacking in ", sleep, " milliseconds");
  setTimeout(attack, sleep, i);
}
