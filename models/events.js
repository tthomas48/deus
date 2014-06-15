var config = require('../config')
  , _und = require('underscore')
  , client = require('twilio')(config.twilio.sid, config.twilio.key)

  // Local caches for event and voting information (will be periodically flushed)    
  , eventsCache = {}
  , secondsToInvalidateEvents = config.couchdb.secondsToInvalidateEvents

  , votesCache = {}
  , secondsToFlushVotes = config.couchdb.secondsToFlushVotes

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

      findBy('byPhonenumber', {key: phonenumber}, function(err, event) {
          if (err) {
            callback(err, null);
          }
          else {
              findBy('all', {key: [event._id], reduce: false}, callback);
          }
      });
    }

  , findBy = exports.findBy = function(view, params, callback) {

      var event;

      //if (event = eventsCache[view+JSON.stringify(params)]) {
      //  callback(null, event);
      //}
      //else {
        
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
              event = body.rows[0].value;
              if (body.rows.length > 1) {
                 for (var i = 0; i < body.rows.length; i++) {
                   if (body.rows[i].value.state != 'off') {
                     event = body.rows[i].value;
                   }
                 }
              }
              //eventsCache[view+JSON.stringify(params)] = event;
              callback(null, event);
            }
          }
        });
      //}
    }

  , save = exports.save = function(cookie, event, callback) {
      if (!event._id) { event._id = 'event:' + event.shortname }
      if (!event.type) { event.type = 'event' } 
      getDb(cookie).insert(event, function(err, body) {
        startTimer(cookie, event);
        callback(err, body);
      });
    }

  , destroy = exports.destroy = function(cookie, id, rev, callback) {
      getDb(cookie).destroy(id, rev, function(err, body) {
        callback(err, body);
      });
    }

  , list = exports.list = function(cookie, callback) {
      getDb(cookie).view('event', 'list', function(err, body) {
        if (err) {
          console.log(err);
          callback(err);
        }
        else {
          var events = _und.map(body.rows, function(row) {return row.value});
          callback(null, events);
        }
      });
    }
  , get = exports.get = function(cookie, id, callback) {
      getDb(cookie).get(id, function(err, body) {
        if (err) {
          console.log(err);
          callback(err);
        }
        else {
          callback(null, body);
        }
      });
    }

  , voteCounts = exports.voteCounts = function(event, callback) {
      getDb().view('event', 'all', {startkey: [event._id], endkey: [event._id, {}, {}], group_level: 2}, function(err, body) {
        if (err) {
          callback(err);
        }
        else {
          // populate count for voteoptions
          event.voteoptions.forEach(function(vo, i){ 
            var found = _und.find(body.rows, function(x) {return x.key[1] == vo.id});
            vo['votes'] = (found? found.value : 0);
          });
          callback();
        }
      });
    }

  ,	saveVote = exports.saveVote = function(event, vote, from) {
      // The _id of our vote document will be a composite of our event_id and the
      // person's phone number. This will guarantee one vote per event 
      var voteDoc = {  
        _id: 'vote:' + event._id + ':' + from,
        type: 'vote',
        event_id: event._id,
        event_phonenumber: event.phonenumber,
        event_timer: event.timer,
        vote: vote,
        seconds: new Date().getTime(),
        phonenumber: from
      };

      votesCache[voteDoc._id] = voteDoc;
  	}

  , flushVotes = function() {
      
      var votesToSave = _und.values(votesCache);
      votesCache = {};

      if (votesToSave.length > 0) {
        getDb().bulk({docs: votesToSave}, function(err, body) {
          if (err) {
            console.log("Failed to save votes, popping them back on the cache");
            votesToSave.forEach(function(v) {
              votesCache[v._id] = v;
            });
          }
          else {
            // loop through the response to detect votes that were rejected as duplicates
            for (var i in votesToSave) {
              if (body[i].error) {
                // send the person an SMS to alert them that you can only vote once
                console.log('Notifying of duplicate vote: ', votesToSave[i])
                client.sendSms({To: votesToSave[i].phonenumber, From: votesToSave[i].event_phonenumber, Body: 'Sorry, you are only allowed to vote once.'});
              }
              else {
                io.sockets.in(votesToSave[i].event_id).emit('vote', votesToSave[i].vote);
                client.sendSms({To: votesToSave[i].phonenumber, From: votesToSave[i].event_phonenumber, Body: 'Thanks for your vote!'});
              }
            }
          }
        });
      }
    }
  , startTimer = exports.startTimer = function(cookie, event) {
    if(event.state == 'on' && event.timer > 0) {
      var votingEvent = {
        type: 'votingEvent',
        event_id: event._id,
        startSeconds: new Date().getTime(),
      };
      console.log('starting timer');
      io.sockets.in(event._id).emit('stateUpdate', {state: 'on', id: event._id, rev: event.rev});
      updateTimer(cookie, event, event.timer, votingEvent);
    }
  }
  , updateTimer = exports.updateTimer = function(cookie, event, expiration, votingEvent) {
      expiration -= 1;
      get(cookie, event._id, function(err, body) {
        io.sockets.in(body._id).emit('timer', expiration);
        if(expiration > 0 && body.state == 'on') {
          setTimeout(updateTimer.bind(null, cookie, body, expiration, votingEvent), 1000);
        } else {
          votingEvent.endSeconds = new Date().getTime();
          getDb(cookie).insert(votingEvent, function() {
            body.state = 'off';
            save(cookie, body, function(err, savedBody) {
              if(savedBody && savedBody.ok) {
                io.sockets.in(event._id).emit('stateUpdate', {state: 'off', id: savedBody.id, rev: savedBody.rev});
              } else {
                console.log(err);
              }
            });
          });
        }
    });
 
 
  }
  , invalidateEvents = function() {
      eventsCache = {};
    }

  , invalidateEventsJob = setInterval(invalidateEvents, 1000*secondsToInvalidateEvents)
  , flushVotesJob = setInterval(flushVotes, 1000*secondsToFlushVotes)
  , io;

module.exports = function(socketio) {
  io = socketio;
  return exports;
};
