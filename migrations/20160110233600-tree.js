'use strict';
var async = require('async');

var dbm;
var type;
var seed;

/**
 * We receive the dbmigrate dependency from dbmigrate initially.
 * This enables us to not have to rely on NODE_PATH.
 */
exports.setup = function (options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = function (db, callback) {
  async.waterfall([
    function (next) {
      db.createTable('trees', {
        id: {type: 'int', primaryKey: true, autoIncrement: true},
        project_id: {
          type: 'int', foreignKey: {
            name: 'trees_project_id_fk',
            table: 'projects',
            rules: {
              onDelete: 'CASCADE',
              onUpdate: 'RESTRICT'
            },
            mapping: 'id'
          }
        }
      }, next);
    },
    function (response, next) {
      db.createTable('cues', {
        id: {type: 'int', primaryKey: true, autoIncrement: true},
        posX: {type: 'int'},
        posY: {type: 'int'},
        event_id: {
          type: 'string',
          length: '48',
          foreignKey: {
            name: 'cues_event_id_fk',
            table: 'events',
            rules: {
              onDelete: 'CASCADE',
              onUpdate: 'RESTRICT'
            },
            mapping: 'id'
          }
        },
        tree_id: {
          type: 'int',
          foreignKey: {
            name: 'cues_tree_id_fk',
            table: 'trees',
            rules: {
              onDelete: 'CASCADE',
              onUpdate: 'RESTRICT'
            },
            mapping: 'id'
          }
        }
      }, next);
    },
    function (response, next) {
      db.createTable('cue_options', {
        id: {type: 'int', primaryKey: true, autoIncrement: true},
        ix: {type: 'int', default: '0'},
        parent_cue_id: {
          type: 'int',
          foreignKey: {
            name: 'parent_cue_id_fk',
            table: 'cues',
            rules: {
              onDelete: 'CASCADE',
              onUpdate: 'RESTRICT'
            },
            mapping: 'id'
          }
        },
        dest_cue_id: {
          type: 'int',
          foreignKey: {
            name: 'dest_cue_id_fk',
            table: 'cues',
            rules: {
              onDelete: 'CASCADE',
              onUpdate: 'RESTRICT'
            },
            mapping: 'id'
          }
        }
      }, next);
    }
  ], callback);

};

exports.down = function (db, callback) {
  async.waterfall([
    function (next) {
      db.dropTable('cue_options', next);
    },
    function (response, next) {
      db.dropTable('cues', next);
    },
    function (response, next) {
      db.dropTable('trees', next);
    }
  ], callback)
};
