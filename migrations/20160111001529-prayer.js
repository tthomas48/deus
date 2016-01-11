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

exports.up = function(db) {
  return null;
};

exports.down = function(db) {
  return null;
};
exports.up = function (db, callback) {
  db.createTable(
      'prayers', {
        id: {type: 'int', primaryKey: true, autoIncrement: true},
        show_id: {
          type: 'int', foreignKey: {
            name: 'prayers_show_id_fk',
            table: 'orgs',
            rules: {
              onDelete: 'CASCADE',
              onUpdate: 'RESTRICT'
            },
            mapping: 'id'
          }
        },
        diety_name: {type: 'string', length: 100},
        voter_id: {
          type: 'int', foreignKey: {
            name: 'prayers_voters_id_fk',
            table: 'voters',
            rules: {
              onDelete: 'CASCADE',
              onUpdate: 'RESTRICT'
            },
            mapping: 'id'
          }
        },
        votedAt: {type: 'datetime'},
      }, callback
  );
};

exports.down = function (db, callback) {
  db.dropTable('prayers', callback);
};