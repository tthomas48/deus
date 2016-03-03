"use strict";
var _ = require('lodash');
var async = require('async');
var utils = require('./utils');
var config = require('../config');

var io, plugins, emitter, models;
var timers = {};
var exports = {

    list: function (req, res) {
      var user = req.user;
      var projectid = req.params.project_id;
      async.waterfall([
        function (next) {
          user.getOrg(next);
        },
        function (org, next) {
          req.models.project.find({org_id: org.id}, next);
        },
        function (project, next) {
          req.models.event.find({project_id: projectid}, next);
        },
        function (events, next) {
          async.each(events, function (event, ecb) {
            req.models.eventoption.find({event_id: event.id}, function (err, eventoptions) {
              event.voteoptions = eventoptions;
              ecb(err, event);
            });
          }, function (err) {
            next(err, events);
          });
        }
      ], function (err, list) {
        if (err) {
          res.send(500, err);
          return;
        }
        res.send(list);
      });
    },
    save: function (req, res) {
      req.body.project_id = req.params.project_id;
      req.models.event.get(req.body.id, function (err, event) {
        if (err) {
          if (err.literalCode === 'NOT_FOUND') {
            req.models.event.create(req.body, function (err, event) {
              if (err) {
                console.log(err);
                res.send(500, JSON.stringify({
                  error: true
                }));
              } else {
                exports.saveOptions(req, event, function() {
                  res.send(event);
                  exports.startTimer(event);
                });
              }
            });
          } else {
            // TODO: Maybe handle create?
            console.log(err);
            res.send(500, JSON.stringify({
              error: true
            }));
          }
        } else {
          _.assign(event, req.body);
          event.save(function (err, event) {
            if (err) {
              console.log(err);
              res.send(500, JSON.stringify({
                error: true
              }));
            } else {
              exports.saveOptions(req, event, function() {
                res.send(event);
                exports.startTimer(event);
              });
            }
          });
        }
      });
    },
    load: function (req, res) {
      req.models.event.get(req.params.id, function (err, event) {
        if (err) {
          res.send(404, 'We could not locate your event');
        } else {
          req.models.eventoption.find({event_id: event.id}, function (err, eventoptions) {
            if (err) {
              res.send(500, 'Could not load eventoptions:' + err);
              return;
            }
            event.voteoptions = eventoptions;
            res.send(JSON.stringify(event));
          });
        }
      });
    },
    delete: function (req, res) {
      req.models.event.get(req.params.id, function (err, event) {
        if (err) {
          res.send(404, 'We could not locate your event');
        } else {
          event.remove(function (err, body) {
            if (err) {
              console.log(err);
              res.send(500, JSON.stringify({
                error: true
              }));
            } else {
              res.send(200, "OK");
            }
          });
        }
      });
    },
    startTimer: function (event) {
      if (timers[event._id]) {
        console.log("Timer already started");
        return;
      }
      if (event.state === 'on' && event.timer > 0) {
        // TODO: add notification of options to all voters
        /*
        shows.findCurrent(function (err, show) {
          if (err || !show) {
            console.log("Couldn't notify voters without show.");
            return;
          }
          */

          var msg = "", j;

          var voteoptions = event.voteoptions;
          if (event.stage === 'whisper') {
            voteoptions = [{id: "1", name: "Yes"}, {id: "2", name: "No"}];
          }

          for (j = 0; j < voteoptions.length; j++) {
            var option = voteoptions[j];
            msg += option.id + ": " + option.name + "\n";
          }

          /*
           TODO: Add back in send prompts
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
           */
          console.log('starting timer');
          io.sockets.emit('stateUpdate', {
            state: 'on',
            id: event._id,
            rev: event.rev
          });
          if (event.movie) {
            io.sockets.emit("/cue/playvideo", {
              mov: event.movie
            });
          }

          exports.updateTimer(event, event.timer);
        //});
      }
    },
    updateTimer: function (event, expiration) {
      /*
      TODO: Add back in show
      shows.findCurrent(function (err, show) {
        if (err || !show) {
          console.log("Couldn't save vote without show.");
          return;
        }
      */

        expiration -= 1;

        //get(cookie, event.id, function (err, body) {
        io.sockets.in(event.id).emit('timer', expiration);
        if (expiration > 0 && event.state === 'on') {
          console.log("Timer: " + expiration);
          timers[event.id] = setTimeout(exports.updateTimer.bind(null, event, expiration), 1000);
        } else {
          console.log("Deleting timer");
          io.sockets.in(event.id).emit('timer', 0);
          delete timers[event.id];

          event.state = 'off';
          event.save(function (err, savedBody) {
            if (err) {
              return console.log(err);
            }

            // could we emit the video cue here?
            io.sockets.emit('stateUpdate', {
              state: 'off',
              id: savedBody.id
            });
          });
        }

            // here we should set the show's winners
            /*
            TODO: Add back in vote record
            updateVotes(cookie, show, event, function (err) {
              if (err) {
                console.log(err);
              }
              body.state = 'off';
              save(cookie, body, function (err, savedBody) {
                if (savedBody && savedBody.ok) {

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
            */

      //});
    },
    saveOptions: function(req, event, next) {
      if (!event.voteoptions) {
        return next();
      }
      async.waterfall([
        function(callback) {
          req.models.eventoption.find({event_id: event.id}, callback);
        },
        function(options, callback) {
          var update = function(option) {
            return function(cb) {
              option.save(cb);
            };
          };
          var create = function(option) {
            return function(cb) {
              req.models.eventoption.create(option, cb);
            };
          };
          var remove = function(option) {
            return function(cb) {
              option.remove(cb);
            };
          };
          var i, j, deleteOptions = [], tasks = [], newOption, foundOption, existingOption;
          for (i = 0; i < options.length; i++) {
            existingOption = options[i];
            foundOption = false;
            for (j = 0; j < event.voteoptions.length; j++) {
              newOption = event.voteoptions[j];
              if (newOption.id === existingOption.id) {
                foundOption = true;
                _.assign(existingOption, newOption);
                tasks.push(update(existingOption));
              }
            }

            if (!foundOption) {
              tasks.push(remove(existingOption));
            }
          }
          for (j = 0; j < event.voteoptions.length; j++) {
            newOption = event.voteoptions[j];
            foundOption = false;
            for (i = 0; i < options.length; i++) {
              existingOption = options[i];
              if (newOption.id === existingOption.id) {
                foundOption = true;
              }
            }
            if (!foundOption) {
              newOption.event_id = event.id;
              tasks.push(create(newOption));
            }
          }
          async.parallel(tasks, callback);
        }
      ], next);

      /*
      var tasks = [];

      for (i = 0; i < event.voteoptions; i++) {
        var voteoption = voteoptions[i];
        tasks.push(function(callback) {
          async.waterfall([
            function() {

            }

          ], callback);

        });
      }
      */

    }
  }
  ;

module.exports = function (socketio, pluginInfo, emitter) {
  io = socketio;
  plugins = pluginInfo;
  emitter = emitter;
  return exports;
};