var config = {};

config.couchdb = {};
config.twilio = {};
config.deus = {};
config.twitter = {};
config.messages = {};

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

config.deus.returningVotes = 1;
config.deus.powerNumber = '';
config.deus.powerVotes = 15;

config.messages.duplicate = 'Sorry, the gods will only hear you once per prayer.';
config.messages.success = 'The gods have heard your voice.';

config.cookiesecret = 'make-this-a-secret';
config.salt = 'make-this-match-your-square-webhook';
module.exports = config;
