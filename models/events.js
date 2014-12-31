var config = require('../config'),
  _und = require('underscore'),
  voters = require('./voters')(io),
  shows = require('./shows')(io),
  client = require('twilio')(config.twilio.sid, config.twilio.key)
  // Local caches for event and voting information (will be periodically flushed)    
  ,
  eventsCache = {}, secondsToInvalidateEvents = config.couchdb.secondsToInvalidateEvents,
  votesCache = {}, timers = {}, msToFlushVotes = config.couchdb.msToFlushVotes,
  getDb = function(cookie) {
    var params = {};
    if(cookie) {
      params.url = config.couchdb.url;
      params.cookie = 'AuthSession=' + cookie;
    } else {
      params.url = config.couchdb.secureUrl;
    }
    return require('nano')(params);
  }
  // Look up the phone number, get the document's ID, then lookup the full document (including votes)
  , findByPhonenumber = exports.findByPhonenumber = function(phonenumber, callback) {
    findBy('byPhonenumber', {
      key: [phonenumber, 'on']
    }, function(err, event) {
      if(err) {
        callback(err, null);
      } else {
        findBy('all', {
          key: [event._id],
          reduce: false
        }, callback);
      }
    });
  }, findBy = exports.findBy = function(view, params, callback) {
    var event;
    //if (event = eventsCache[view+JSON.stringify(params)]) {
    //  callback(null, event);
    //}
    //else {
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
    //}
  }, save = exports.save = function(cookie, event, callback) {
    if(!event._id) {
      event._id = 'event:' + event.shortname
    }
    if(!event.type) {
      event.type = 'event'
    }
    getDb(cookie).insert(event, function(err, body) {
      startTimer(cookie, event);
      callback(err, body);
    });
  }, destroy = exports.destroy = function(cookie, id, rev, callback) {
    getDb(cookie).destroy(id, rev, function(err, body) {
      callback(err, body);
    });
  }, list = exports.list = function(cookie, callback) {
    getDb(cookie).view('event', 'list', function(err, body) {
      if(err) {
        console.log(err);
        callback(err);
      } else {
        var events = _und.map(body.rows, function(row) {
          return row.value
        });
        callback(null, events);
      }
    });
  }, get = exports.get = function(cookie, id, callback) {
    getDb(cookie).get(id, function(err, body) {
      if(err) {
        console.log(err);
        callback(err);
      } else {
        callback(null, body);
      }
    });
  }, voteCounts = exports.voteCounts = function(event, callback) {
    getDb().view('event', 'all', {
      startkey: [event._id],
      endkey: [event._id, {}, {}],
      group_level: 2
    }, function(err, body) {
      if(err) {
        callback(err);
      } else {
        // populate count for voteoptions
        event.voteoptions.forEach(function(vo, i) {
          var found = _und.find(body.rows, function(x) {
            return x.key[1] == vo.id
          });
          vo['votes'] = (found ? found.value : 0);
        });
        callback();
      }
    });
  }, saveVote = exports.saveVote = function(event, vote, from) {
    // The _id of our vote document will be a composite of our event_id and the
    // person's phone number. This will guarantee one vote per event 
    shows.findCurrent(function(err, show) {
      if (err || !show) {
        console.log("Couldn't save vote without show.");
        return;
      }
      voters.findByPhonenumber(from, function(err, voter) {
        if(err) {
          console.log("Creating new voter");
          voter = {
            phonenumber: from,
            votes: 1
          };
        } else {
          if (!show.winners || show.winners.legnth == 0) {
            // returning voter give 'em a bonus
            voter.votes = Number(voter.votes) + Number(config.deus.returningVotes);
          }
        }
        if (!voter.shows) {
          voter.shows = [];
        }
        
        if (voter.shows.indexOf(show._id) < 0) {
          voter.shows.push(show._id);
        }
        voters.save(getDb(), voter, function() {
          console.log("Inserting " + voter.votes + " votes.");
          var seconds = new Date().getTime();
          var i;
          for(i = 0; i < voter.votes; i++) {
            var voteDoc = {
              _id: 'vote:' + event._id + ':' + from + ":" + show._id + ":" + i,
              type: 'vote',
              show_id: show._id,
              event_id: event._id,
              event_phonenumber: event.phonenumber,
              event_timer: event.timer,
              vote: vote,
              seconds: new Date().getTime(),
              phonenumber: from
            };
            votesCache[voteDoc._id] = voteDoc;
            io.sockets.in(event._id).emit('vote', vote);
          }
        });
      });
    });
  }, flushVotes = function() {
    var votesToSave = _und.values(votesCache);
    votesCache = {};
    if(votesToSave.length > 0) {
      getDb().bulk({
        docs: votesToSave
      }, function(err, body) {
        if(err) {
          console.log("Failed to save votes, popping them back on the cache");
          votesToSave.forEach(function(v) {
            votesCache[v._id] = v;
          });
        } else {
          var notified = [];
          // loop through the response to detect votes that were rejected as duplicates
          for(var i in votesToSave) {
            if(body[i].error) {
              // send the person an SMS to alert them that you can only vote once
              console.log('Notifying of duplicate vote: ', votesToSave[i])
              client.sendSms({
                To: votesToSave[i].phonenumber,
                From: votesToSave[i].event_phonenumber,
                Body: 'Sorry, the gods will only hear you once per prayer.'
              });
            } else {
              if (notified.indexOf(votesToSave[i].phonenumber) < 0) {
                
                client.sendSms({
                  To: votesToSave[i].phonenumber,
                  From: votesToSave[i].event_phonenumber,
                  Body: 'The gods have heard your voice.'
                });
                notified.push(votesToSave[i].phonenumber);
              }
            }
          }
        }
      });
    }
  }, startTimer = exports.startTimer = function(cookie, event) {
    if(timers[event._id]) {
      console.log("Timer already started");
      return;
    }
    if(event.state == 'on' && event.timer > 0) {
      // TODO: add notification of options to all voters
      shows.findCurrent(function(err, show) {
        if (err || !show) {
          console.log("Couldn't notify voters without show.");
          return;
        }
        
        var msg ="", j;
        
        var voteoptions = event.voteoptions;
        if (event.stage === 'whisper') {
          voteoptions = [{id:"1", name:"Yes"}, {id:"2", name:"No"}];
        }
        
        for (j = 0; j < voteoptions.length; j++) {
          var option = voteoptions[j];
          msg += option.id + ": " + option.name + "\n";
        }
        
        voters.list(cookie, function (err, voters) {
          var i;
          for (i = 0; i < voters.length; i++) {
            var voter = voters[i];
            if (voter.shows && voter.shows.indexOf(show._id) >= 0) {
              //console.log("Notifying " + voter.phonenumber);
              client.sendSms({
                To: voter.phonenumber,
                From: event.phonenumber,
                Body: msg
              });
            }
          }
        });
        console.log('starting timer');
        io.sockets.emit('stateUpdate', {
          state: 'on',
          id: event._id,
          rev: event.rev
        });
        updateTimer(cookie, event, event.timer);
      });
    }
  }, updateTimer = exports.updateTimer = function(cookie, event, expiration) {
    shows.findCurrent(function(err, show) {
      if (err || !show) {
        console.log("Couldn't save vote without show.");
        return;
      }
    
      expiration -= 1;
      get(cookie, event._id, function(err, body) {
        io.sockets. in (body._id).emit('timer', expiration);
        if(expiration > 0 && body.state == 'on') {
          console.log("Timer: " + expiration);
          timers[body._id] = setTimeout(updateTimer.bind(null, cookie, body, expiration), 1000);
        } else {
          console.log("Deleting timer");
          io.sockets. in (body._id).emit('timer', 0);
          delete timers[body._id];

          // here we should set the show's winners
          updateVotes(cookie, show, event._id, function(err) {
            if (err) {
              console.log(err);
            }
            body.state = 'off';
            save(cookie, body, function(err, savedBody) {
              if(savedBody && savedBody.ok) {
                io.sockets.emit('stateUpdate', {
                  state: 'off',
                  id: savedBody.id,
                  rev: savedBody.rev
                });
              } else {
                console.log(err);
              }
            });
          });
        }
      });
    });
  }, updateVotes = exports.updateVotes = function(cookie, show, event_id, callback) {
    getDb(cookie).view('event', 'votesByShowEvent', {key: [show._id, event_id]}, function(err, body) {
      var rows = body.rows;
      var results = {};
      var i;
      for (i = 0; i < rows.length; i++) {
        if (!results[rows[i].value]) {
          results[rows[i].value] = 0;
        }
        results[rows[i].value]++;
      }
      if (!show.winners) {
        show.winners = {};
      }
      // TODO: This needs to be the cue number, not the event ID. How to get???
      if (!show.cues) {
        callback.call(undefined, "Cannot figure out what cue to save these winners to.", {ok: false});
        return;
      }
      var cues = show.cues;
      var cueNumber = cues[cues.length - 1];
      show.winners[cueNumber] = results;
      shows.save(cookie, show, function() {
        console.log("Saved winners");
      });
      
      if (callback()) {
        callback.call(undefined, undefined, {ok: true});
      }
    });
  }, invalidateEvents = function() {
    eventsCache = {};
  }, invalidateEventsJob = setInterval(invalidateEvents, 1000 * secondsToInvalidateEvents),
  flushVotesJob = setInterval(flushVotes, msToFlushVotes),
  io;
module.exports = function(socketio) {
  io = socketio;
  return exports;
};