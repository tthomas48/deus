'use strict';

var dbm;
var type;
var seed;
var async = require('async');

/**
  * We receive the dbmigrate dependency from dbmigrate initially.
  * This enables us to not have to rely on NODE_PATH.
  */
exports.setup = function(options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = function(db, callback) {
  async.waterfall([
    function (next) {
      db.addColumn('events', 'name', {length: 200, type: 'string'}, next);
    },
    function(response, next) {
      db.addColumn('projects', 'phonenumber', {length: 12, type: 'string'}, next);
    }
  ], callback);

  return null;
};

exports.down = function(db, callback) {
  async.waterfall([
    function (next) {
      db.removeColumn('events', 'name', next);
    },
    function(response, next) {
      db.removeColumn('projects', 'phonenumber', next);
    }
  ], callback);
};
