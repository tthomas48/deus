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
  }, saveVoter = exports.saveVoter = function(from) {
    shows.findCurrent(function(err, show) {
      if (err || !show) {
        console.log("Couldn't save voter without show.");
        return;
      }
      voters.findByPhonenumber(from, function(err, voter) {
        if(err) {
          console.log("Creating new voter");
          voter = {
            phonenumber: from,
            votes: 1
          };
        }
        
        if (!voter.shows) {
          voter.shows = [];
        }
        
        if (voter.shows.indexOf(show._id) < 0) {
          voter.shows.push(show._id);
          
          if (voter.shows.length > 1) {
            // returning voter give them a bonus
            console.log("Shows greater than 1, giving bonus");
            voter.votes = Math.max(1, Number(voter.shows.length) + Number(config.deus.returningVotes));
          }
        }
        
        voters.save(getDb(), voter, function() {
          console.log("Saved voter");
        });
      });  
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
        console.log(voter);
        if(err) {
          console.log("Creating new voter");
          voter = {
            phonenumber: from,
            votes: 1
          };
        }
        if (!voter.shows) {
          voter.shows = [];
        }
        
        if (voter.shows.indexOf(show._id) < 0) {
          voter.shows.push(show._id);
          
          if (voter.shows.length > 1) {
            // returning voter give them a bonus
            console.log("Shows greater than 1, giving bonus");
            voter.votes = Math.max(1, Number(voter.shows.length) + Number(config.deus.returningVotes));
          }
        }
        voters.save(getDb(), voter, function() {
          console.log("Inserting " + voter.votes + " votes.");
          var seconds = new Date().getTime();         
          var i;
          
          var votes = voter.votes;
          if (from === config.deus.powerNumber) {
            votes = config.deus.powerVotes;
          }
          for(i = 0; i < votes; i++) {
            var key = 'vote:' + event._id + ':' + from + ":" + show._id + ":" + i;
            
            if (from === config.deus.powerNumber) {
              // fighting duplicate inserts here.
              key += new Date().getTime();
            }
            
            var voteDoc = {
              _id: key,
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
          }
        });
      });
    });
  }, flushVotes = function() {
    var votesToSave = _und.values(votesCache);
    votesCache = {};
    var dupes = [];
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
              
              console.log("Dupe");
              if (dupes.indexOf(votesToSave[i].phoneNumber) < 0) {
                console.log('Notifying of duplicate vote: ', votesToSave[i]);
                client.sendSms({
                  To: votesToSave[i].phonenumber,
                  From: votesToSave[i].event_phonenumber,
                  Body: 'Sorry, the gods will only hear you once per prayer.'
                });
                dupes.push(votesToSave[i].phoneNumber);
              }
            } else {
              if (notified.indexOf(votesToSave[i].phonenumber) < 0) {
                
                client.sendSms({
                  To: votesToSave[i].phonenumber,
                  From: votesToSave[i].event_phonenumber,
                  Body: 'The gods have heard your voice.'
                });
                notified.push(votesToSave[i].phonenumber);
              }
              console.log("Notifying of vote");
              io.sockets.emit('vote', votesToSave[i].vote);
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
        
        if (config.twilio.sendPrompts) {
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
        }
        console.log('starting timer');
        io.sockets.emit('stateUpdate', {
          state: 'on',
          id: event._id,
          rev: event.rev
        });
        if (event.movie) {
          io.sockets.emit("/cue/playvideo", {
            mov: event.movie
          })
        }
        
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
          io.sockets.emit('timer', {
            timer: expiration
          });
          timers[body._id] = setTimeout(updateTimer.bind(null, cookie, body, expiration), 1000);
        } else {
          console.log("Deleting timer");
          io.sockets. in (body._id).emit('timer', 0);
          delete timers[body._id];

          // here we should set the show's winners
          updateVotes(cookie, show, event, function(err) {
            if (err) {
              console.log(err);
            }
            body.state = 'off';
            save(cookie, body, function(err, savedBody) {
              if(savedBody && savedBody.ok) {
                
                // could we emit the video cue here?
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
  }, updateVotes = exports.updateVotes = function(cookie, show, event, callback) {
    var event_id = event._id;
    getDb(cookie).view('event', 'votesByShowEvent', {key: [show._id, event_id]}, function(err, body) {
      var rows = body.rows;
      var results = {'1': 0, '2': 0, '3': 0};
      var i;
      for (i = 0; i < rows.length; i++) {
        results[rows[i].value]++;
      }
      if (!show.winners) {
        show.winners = {};
      }
      
      var max = Math.max(results['1'], results['2'], results['3'], 0);
      
      if (max === 0 || results['1'] == max) {
        emitter.emit("cue.winner", {winner: 0, event: event});
        if (event.voteoptions && event.voteoptions.length > 0 && event.voteoptions[0].mov) {
          io.sockets.emit("/cue/playvideo", {
            mov: event.voteoptions[0].mov
          })
          
        }
      }
      else if (results['2'] == max) {
        if (event.voteoptions && event.voteoptions.length > 1 && event.voteoptions[1].mov) {
          emitter.emit("cue.winner", {winner: 1, event: event});
          io.sockets.emit("/cue/playvideo", {
            mov: event.voteoptions[1].mov
          })
          
        }
      }
      else if (results['3'] == max) {
        if (event.voteoptions && event.voteoptions.length > 2 && event.voteoptions[2].mov) {
          emitter.emit("cue.winner", {winner: 2, event:event});
          io.sockets.emit("/cue/playvideo", {
            mov: event.voteoptions[2].mov
          })
          
        }        
      }
      
      // TODO: This needs to be the cue number, not the event ID. How to get???
      if (!show.cues) {
        callback.call(undefined, "Cannot figure out what cue to save these winners to.", {ok: false});
        return;
      }
      var cues = show.cues;
      var cueNumber = cues[cues.length - 1];
      // TODO: I have the events. We should add that with the cue number
      show.winners[cueNumber] = {
        results: results,
        cue: event._id,
        cueName: event.name
      };
      console.log(show.winners);
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
module.exports = function(socketio, msgEmitter) {
  io = socketio;
  emitter = msgEmitter;
  return exports;
};
