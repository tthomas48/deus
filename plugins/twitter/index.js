function twitter(name, deps) {
  var events = require('../../models/events')(deps.io);
  var tree = require('../../models/tree')(deps.io);
  var shows = require('../../models/shows')(deps.io);
  var config = require('../../config');

  var Twitter = require('twitter');

  var client = new Twitter(config.twitter.auth);

  client.stream('statuses/filter', {track: config.twitter.search}, function(stream) {
    stream.on('data', function(tweet) {
      console.log(tweet.text);
      console.log(tweet);

      deps.io.sockets.emit('cue.tweet', tweet);

    });

    stream.on('error', function(error) {
      console.error(error);
      //throw error;
    });
  });

  var dummy = { created_at: 'Tue Mar 08 02:57:32 +0000 2016',
    id: 707052025347833856,
    id_str: '707052025347833856',
    text: 'Testing more #testinggod',
    source: '<a href="http://twitter.com" rel="nofollow">Twitter Web Client</a>',
    truncated: false,
    in_reply_to_status_id: null,
    in_reply_to_status_id_str: null,
    in_reply_to_user_id: null,
    in_reply_to_user_id_str: null,
    in_reply_to_screen_name: null,
    user:
    { id: 2717191,
      id_str: '2717191',
      name: 'Tim Thomas',
      screen_name: 'tthomas48',
      location: 'Austin, TX',
      url: 'http://about.me/bpt',
      description: 'A software developer who likes to rant about politics, development, and theatre.',
      protected: false,
      verified: false,
      followers_count: 460,
      friends_count: 367,
      listed_count: 23,
      favourites_count: 130,
      statuses_count: 3735,
      created_at: 'Wed Mar 28 20:26:27 +0000 2007',
      utc_offset: -21600,
      time_zone: 'Central Time (US & Canada)',
      geo_enabled: false,
      lang: 'en',
      contributors_enabled: false,
      is_translator: false,
      profile_background_color: '8B542B',
      profile_background_image_url: 'http://abs.twimg.com/images/themes/theme8/bg.gif',
      profile_background_image_url_https: 'https://abs.twimg.com/images/themes/theme8/bg.gif',
      profile_background_tile: false,
      profile_link_color: '9D582E',
      profile_sidebar_border_color: 'D9B17E',
      profile_sidebar_fill_color: 'EADEAA',
      profile_text_color: '333333',
      profile_use_background_image: true,
      profile_image_url: 'http://pbs.twimg.com/profile_images/659186660182237184/61x7sASq_normal.jpg',
      profile_image_url_https: 'https://pbs.twimg.com/profile_images/659186660182237184/61x7sASq_normal.jpg',
      profile_banner_url: 'https://pbs.twimg.com/profile_banners/2717191/1390445615',
      default_profile: false,
      default_profile_image: false,
      following: null,
      follow_request_sent: null,
      notifications: null },
    geo: null,
    coordinates: null,
    place: null,
    contributors: null,
    is_quote_status: false,
    retweet_count: 0,
    favorite_count: 0,
    entities:
    { hashtags: [ [Object] ],
      urls: [],
      user_mentions: [],
      symbols: [] },
    favorited: false,
    retweeted: false,
    filter_level: 'low',
    lang: 'en',
    timestamp_ms: '1457405852900' };


    //setInterval(function() { deps.io.sockets.emit('cue.tweet', dummy); }, 2000);



}
module.exports = twitter;