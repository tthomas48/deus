'use strict';

var dbm;
var type;
var seed;

/**
  * We receive the dbmigrate dependency from dbmigrate initially.
  * This enables us to not have to rely on NODE_PATH.
  */
exports.setup = function(options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = function (db, callback) {
  async.waterfall([
    function (next) {
      db.createTable('shows', {
        id: {type: 'int', primaryKey: true, autoIncrement: true},
        startedAt: {type: 'datetime'},
        current: {type: 'boolean'},
        phonenumber: {length: 20, type: 'string'},
        project_id: {
          type: 'int',
          foreignKey: {
            name: 'shows_project_id_fk',
            table: 'projects',
            rules: {
              onDelete: 'CASCADE',
              onUpdate: 'RESTRICT'
            },
            mapping: 'id'
          }
        }
      }, next);

    }, function (response, next) {
      db.createTable('show_results', {
        id: {type: 'int', primaryKey: true, autoIncrement: true},
        show_id: {
          type: 'int', foreignKey: {
            name: 'show_results_show_id_fk',
            table: 'shows',
            rules: {
              onDelete: 'CASCADE',
              onUpdate: 'RESTRICT'
            },
            mapping: 'id'
          }
        },
        leaf_id: {
          type: 'int', foreignKey: {
            name: 'show_results_tree_leaves_id_fk',
            table: 'tree_leaves',
            rules: {
              onDelete: 'CASCADE',
              onUpdate: 'RESTRICT'
            },
            mapping: 'id'
          }
        },
        result: {type: 'int'}
      }, next);
    }
  ], callback);

};

exports.down = function (db, callback) {
  async.waterfall([
    function (next) {
      db.dropTable('show_results', next);
    },
    function (response, next) {
      db.dropTable('shows', next);
    }

  ], callback)
};