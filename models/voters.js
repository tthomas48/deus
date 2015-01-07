var config = require('../config')
  , _und = require('underscore')
  , client = require('twilio')(config.twilio.sid, config.twilio.key)

  // Local caches for event and voting information (will be periodically flushed)    


  , getDb = function(cookie) {
      var params = {};
      if (cookie) {
        params.url = config.couchdb.url;
        params.cookie = 'AuthSession='+cookie;
      }
      else {
        params.url = config.couchdb.secureUrl;
      }
      return require('nano')(params); 
    }

  // Look up the phone number, get the document's ID, then lookup the full document (including votes)
  , findByPhonenumber = exports.findByPhonenumber = function(phonenumber, callback) {

    console.log("Looking up ", phonenumber);
      findBy('voterByPhonenumber', {key: phonenumber}, function(err, rows) {
          if (err) {
            callback(err, null);
          }
          else {
            console.log(rows);
            if (rows.length < 1) {
              callback("No rows found", null);
              return;
            }
            var voter = rows[0];
            findBy('all', {key: [voter._id], reduce: false}, function(err, rows) {
              if (rows && rows.length > 0) {
                callback(err, rows[0]);  
                return;
              }
              callback(err, undefined);
            });
          }
      });
    }

  , findByShow = exports.findByShow = function(show_id, callback) {

      findBy('votersByShow', {key: show_id}, callback);
    }


  , findBy = exports.findBy = function(view, params, callback) {

      var voter;

        getDb().view('event', view, params, function(err, body) {
          if (err) {
            console.log(err);
            callback(err, null);
          }
          else {
            if (body.rows.length == 0) {
              var msg = 'No match for: ' + view + ', ' + JSON.stringify(params);
              console.log(msg);
              callback(msg, null);              
            }
            else {
              var values = [], i;
              for(i = 0; i < body.rows.length; i++) {
                values.push(body.rows[i].value);
              }
              callback(null, values);
            }
          }
        });
    }
  , save = exports.save = function(cookie, voter, callback) {
      if (!voter._id) { voter._id = 'voter:' + voter.phonenumber }
      if (!voter.type) { voter.type = 'voter' } 
      getDb(cookie).insert(voter, function(err, body) {
        callback(err, body);
      });
    }

  , destroy = exports.destroy = function(cookie, id, rev, callback) {
      getDb(cookie).destroy(id, rev, function(err, body) {
        callback(err, body);
      });
    }

  , list = exports.list = function(cookie, callback) {
      getDb(cookie).view('event', 'voters', function(err, body) {
        if (err) {
          console.log(err);
          callback(err);
        }
        else {
          body.rows.sort(function(a, b) {
            return b.value.votes - a.value.votes;
          });
          
          var voters = _und.map(body.rows, function(row) {return row.value});
          callback(null, voters);
        }
      });
    }
  , io;

module.exports = function(socketio) {
  io = socketio;
  return exports;
};
