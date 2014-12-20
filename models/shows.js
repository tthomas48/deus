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
  findCurrent = exports.findCurrent = function(callback) {
    findBy('currentShow', {
      key: true
    }, function(err, show) {
      if(err) {
        callback(err, null);
      } else {
        console.log(show);
        findBy('shows', {
          key: [show._id],
          reduce: false
        }, callback);
      }
    });
  },
  findBy = exports.findBy = function(view, params, callback) {
    var show;
    getDb().view('event', view, params, function(err, body) {
      if(err) {
        console.log(err);
        callback(err, null);
      } else {
        if(body.rows.length == 0) {
          var msg = 'No match for: ' + view + ', ' + JSON.stringify(params);
          console.log(msg);
          callback(msg, null);
        } else {
          event = body.rows[0].value;
          if(body.rows.length > 1) {
            for(var i = 0; i < body.rows.length; i++) {
              if(body.rows[i].value.state != 'off') {
                event = body.rows[i].value;
              }
            }
          }
          //eventsCache[view+JSON.stringify(params)] = event;
          callback(null, event);
        }
      }
    });
  }, save = exports.save = function(cookie, show, callback) {
    if(!show._id) {
      show._id = 'show:' + show.id;
    }
    if(!show.type) {
      show.type = 'show'
    }
    getDb(cookie).insert(show, function(err, body) {
      io.sockets.emit("currentShow.update", {
        currentShow: body
      })
      callback(err, body);
    });
  }, destroy = exports.destroy = function(cookie, id, rev, callback) {
    getDb(cookie).destroy(id, rev, function(err, body) {
      callback(err, body);
    });
  }, list = exports.list = function(cookie, callback) {
    getDb(cookie).view('event', 'shows', function(err, body) {
      if(err) {
        console.log(err);
        callback(err);
      } else {
        var shows = _und.map(body.rows, function(row) {
          return row.value
        });
        callback(null, shows);
      }
    });
  },
  io;
module.exports = function(socketio) {
  io = socketio;
  return exports;
};