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
  trigger_threshhold = exports.trigger_threshhold = function(deity_name) {
      //#TODO: [enhancement] move the threshhold values to admin configuration
      var prayerThreshholds = {
        'athena': 10, 
        'apollo': 10, 
        'hera': 10, 
        'zeus': 10
      };
      return prayerThreshholds[deity_name] || 10;
  },
  newPrayerData = exports.newPrayerData = function() {
    //#TODO: move the deity names into a global configuration (and then into an admin config setting)
    var newPrayerData = {'athena': 0, 'apollo': 0, 'hera': 0, 'zeus': 0};
    return newPrayerData;
  },
  getPrayerCountId = function(show_id, deity_name) {
    return 'prayerCount:' + show_id + '-' + deity_name;
  },
  getPrayerId = function(show_id, deity_name, phonenumber) {
    return 'prayer:' + show_id + '-' + deity_name + '-' + phonenumber;
  },
  getCountForDeity = exports.getCountForDeity = function(deity, show_id, callback) {
    prayerId = getPrayerCountId(show_id, deity);
    getDb().view('event', 'prayerCounts', {
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
        getDb().view('event', 'prayerCountsByShow', {
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
  getPrayer = exports.getPrayer = function(from_phonenumber, show_id, deity_name, callback) {
    //console.log("found current show: "+JSON.stringify(show));
    // retrieve current count for this deity by show ID
    var prayerId = getPrayerId(show_id, deity_name, from_phonenumber);
    getDb().view('event', 'prayers', {
        startkey: prayerId,
        endkey: prayerId,
      }, function(err, body) {
        if(err || body.rows.length == 0) {
          if(err) {
            callback("Error querying prayer with ID "+prayerId+": "+err, null);
          } else {
            // no current prayer found
            callback(null, null);
          }
        } else {
          // found a matching prayer record, provide it
          if(body.rows.length > 1) {
            console.log("WARNING: Multiple prayer records found for ID "+prayerId);
          }
          callback(null, body.rows[0].value);
        }
      }
    );
  },
  saveCount = exports.saveCount = function(cookie, prayerCount, callback) {
    if(!prayerCount._id) {
      if(!prayerCount.show_id) {
          callback("Can't save PrayerCount without ShowID", null);
          return;
      } else if(!prayerCount.deity_name) {
          callback("Can't save PrayerCount without DeityName", null);
          return;
      }
      prayerCount._id = getPrayerCountId(prayerCount.show_id, prayerCount.deity_name);
      console.log("Setting prayerCount._id to: "+prayerCount._id);
    }
    if(!prayerCount.type) {
      prayerCount.type = 'prayerCount'
    }
    getDb(cookie).insert(prayerCount, function(err, body) {
      callback(err, body);
    });
  },
  savePrayer = exports.savePrayer = function(cookie, prayer, callback) {
    if(!prayer._id) {
      if(!prayer.show_id) {
          callback("Can't save Prayer without ShowID", null);
          return;
      } else if(!prayer.deity_name) {
          callback("Can't save Prayer without DeityName", null);
          return;
      } else if(!prayer.phonenumber) {
          callback("Can't save Prayer without Sender phonenumber", null);
          return;
      }
      prayer._id = getPrayerId(prayer.show_id, prayer.deity_name, prayer.phonenumber);
      console.log("Setting prayer._id to: "+prayer._id);
    }
    if(!prayer.type) {
      prayer.type = 'prayer'
    }
    if(!prayer.created) {
      prayer.created = new Date().getTime();
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