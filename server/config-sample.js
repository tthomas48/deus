var config = {};

config.couchdb = {};
config.twilio = {};
config.deus = {};
confir.mandrill = {};

config.couchdb.url = 'https://couchserver:port/database';
config.couchdb.secureUrl = 'https://username:password@couchserver:port/database';
config.couchdb.secondsToInvalidateEvents = 120;
config.couchdb.msToFlushVotes = 250;

config.twilio.sid = 'ACxxx';
config.twilio.key = 'yyy';
config.twilio.smsWebhook = 'https://nodeserver/vote/sms';
config.twilio.voiceWebhook = 'https://nodeserver/vote/voice';
config.twilio.disableSigCheck = false;
config.twilio.sendPrompts = false;

config.deus.baseUrl = "http://localhost:3000";
config.deus.returningVotes = 1;
config.deus.powerNumber = '';
config.deus.powerVotes = 15;

config.mandrill.api_key = ''

config.tokensecret = 'this-is-a-secret-dont-tell-anyone';
config.cookiesecret = 'make-this-a-secret';
config.salt = 'make-this-match-your-square-webhook';
module.exports = config;
