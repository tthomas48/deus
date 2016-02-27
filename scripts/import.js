"use strict";

var data  = require('./export');
var async = require('async');
var _     = require('lodash');
var environment = process.env.NODE_ENV || "development";
var database = require('./../server/database')[environment];
var orm   = require('orm');
var db = orm.connect({
        host: database.host,
        database: database.database,
        protocol: database.driver,
        port: database.port,
        user: database.user,
        password: database.password,
        query: {
          debug: database.debug,
          pool: database.pool
        }
      }, function() {
        require(__dirname + '/models')(db, db.models, function(err) {
          if (err) return console.error('Connection error: ' + err);
          async.waterfall([
            function(next) {
              db.models.org.find({'name': 'Whirligig'}, next);
            },
            function(items, next) {
              var org = items[0];
              // lets create our project
              db.models.project.create({
                "org_id": org.id,
                "name": "Deus ex Machina"
              }, next);
            },
            function(project, next) {
              var events = [];
              var eventoptions = []
              _.forEach(data.docs, function (doc) {
                if (doc.doc.type === 'event') {
                  events.push({
                    id: doc.doc._id,
                    project_id: project.id,
                    name: doc.doc.name,
                    shortname: doc.doc.shortname,
                    state: doc.doc.state,
                    timer: doc.doc.timer,
                    view: doc.doc.view,
                    screen: doc.doc.screen,
                    stage: doc.doc.stage,
                    voting: doc.doc.voting,
                    movie: doc.doc.movie
                  });
                  _.forEach(doc.doc.voteoptions, function(option) {
                    eventoptions.push({
                      event_id: doc.doc._id,
                      ix: option.id,
                      name: option.name,
                      img: option.img,
                      mov: option.mov,
                      snd: option.snd,
                    });
                  });
                }
              });
              next(null, events, eventoptions);
            },
            function(events, eventoptions, next) {
              async.each(events, db.models.event.create, function(error) {
                next(error, eventoptions);
              });
            },
            function(eventoptions, next) {
              async.each(eventoptions, db.models.eventoption.create, next);
            }
          ], function(err, output) {
            if (err) {
              console.log("ERROR: " + err);
            }
            console.log(output);
            process.exit(0);
          });
        });
      }
  );
