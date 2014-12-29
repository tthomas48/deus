var config = {};

config.couchdb = {};
config.twilio = {};
config.deus = {};

config.couchdb.url = 'https://couchserver:port/database';
config.couchdb.secureUrl = 'https://username:password@couchserver:port/database';
config.couchdb.secondsToInvalidateEvents = 120;
config.couchdb.msToFlushVotes = 250;

config.twilio.sid = 'ACxxx';
config.twilio.key = 'yyy';
config.twilio.smsWebhook = 'https://nodeserver/vote/sms';
config.twilio.voiceWebhook = 'https://nodeserver/vote/voice';
config.twilio.disableSigCheck = false;

config.deus.returningVotes = 1;

config.cookiesecret = 'make-this-a-secret';
config.salt = 'make-this-match-your-square-webhook';
module.exports = config;
