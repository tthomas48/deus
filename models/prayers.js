var config = require('../config'),
  _und = require('underscore'),
  getDb = function(cookie) {
    var params = {};
    if(cookie) {
      params.url = config.couchdb.url;
      params.cookie = 'AuthSession=' + cookie;
    } else {
      params.url = config.couchdb.secureUrl;
    }
    return require('nano')(params);
  },
  trigger_threshhold = exports.trigger_threshhold = function() {
      //#TODO: [enhancement] move the threshhold value to admin configuration
      return 3;
  },
  newPrayerData = exports.newPrayerData = function() {
    //#TODO: move the deity names into a global configuration (and then into an admin config setting)
    var newPrayerData = {'athena': 0, 'apollo': 0, 'hera': 0, 'zeus': 0};
    return newPrayerData;
  },
  getPrayerId = function(show_id, deity_name) {
    return 'prayer:' + show_id + '-' + deity_name;
  },
  getCountForDeity = exports.getCountForDeity = function(deity, show_id, callback) {
    prayerId = getPrayerId(show_id, deity);
    getDb().view('event', 'prayers', {
        startkey: [prayerId],
        endkey: [prayerId, {}, {}],
        //group_level: 2
      }, function(err, body) {
        if(err || body.rows.length == 0) {
          if(err) {
            console.log("Error querying prayerCount found for "+deity+" in show "+show_id+": "+err);
          } else {
            console.log("No current prayerCount found for "+deity+" in show "+show_id+", creating new record...");
            // no current count found, return a record with 0 values for counts
            var newPrayer = {show_id: show_id, deity_name: deity, total_count: 0, current_count: 0, trigger_count: 0};
            callback(null, newPrayer);
          }
        } else {
          prayer = body.rows[0].value;
          if(body.rows.length > 1) {
            console.log("WARNING: Multiple records found for deity '"+deity+"' in show "+show_id);
          }
          callback(null, prayer);
        }
      }
    );
  },
  getPrayerCounts = exports.getPrayerCounts = function(callback) {
    shows.findCurrent(function(err, show) {
      if(err) {
        // [validation] if there is no current show, ignore the incoming message
        console.log("No current show, can't get prayer counts. Detail: " + err);
      } else {
        //console.log("found current show: "+JSON.stringify(show));
        // retrieve current count for this deity by show ID
        getDb().view('event', 'prayersByShow', {
            startkey: show.id,
            endkey: show.id,
            //group_level: 2
          }, function(err, body) {
            if(err || body.rows.length == 0) {
              if(err) {
                console.log("Error querying prayer counts for show "+show.id+": "+err);
              } else {
                // no current count found, provide a record with 0 values for counts
                callback(null, newPrayerData());
              }
            } else {
              var prayerCountData = newPrayerData();
              for(var i=0; i<body.rows.length; i++) {
                var prayerCount = body.rows[i].value;
                //console.log("deity prayer record: "+JSON.stringify(prayerCount))
                prayerCountData[prayerCount.deity_name] = prayerCount.current_count;
              }
              callback(null, prayerCountData);
            }
          }
        );
      }
    }
  )},
  save = exports.save = function(cookie, prayer, callback) {
    if(!prayer._id) {
      if(!prayer.show_id) {
          callback("Can't save Prayer without ShowID", null);
          return;
      } else if(!prayer.deity_name) {
          callback("Can't save Prayer without DeityName", null);
          return;
      }
      prayer._id = getPrayerId(prayer.show_id, prayer.deity_name);
      console.log("Setting prayer _id to: "+prayer._id);
    }
    if(!prayer.type) {
      prayer.type = 'prayer'
    }
    getDb(cookie).insert(prayer, function(err, body) {
      callback(err, body);
    });
  },
  destroy = exports.destroy = function(cookie, id, rev, callback) {
    getDb(cookie).destroy(id, rev, function(err, body) {
      callback(err, body);
    });
  },
  io;
module.exports = function(socketio) {
  io = socketio;
  return exports;
};