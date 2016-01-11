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
  db.createTable(
      'votes', {
        id: {type: 'int', primaryKey: true, autoIncrement: true},
        show_id: {
          type: 'int', foreignKey: {
            name: 'votes_show_id_fk',
            table: 'orgs',
            rules: {
              onDelete: 'CASCADE',
              onUpdate: 'RESTRICT'
            },
            mapping: 'id'
          }
        },
        leaf_id: {
          type: 'int', foreignKey: {
            name: 'votes_tree_leaves_id_fk',
            table: 'tree_leaves',
            rules: {
              onDelete: 'CASCADE',
              onUpdate: 'RESTRICT'
            },
            mapping: 'id'
          }
        },
        voter_id: {
          type: 'int', foreignKey: {
            name: 'votes_voters_id_fk',
            table: 'voters',
            rules: {
              onDelete: 'CASCADE',
              onUpdate: 'RESTRICT'
            },
            mapping: 'id'
          }
        },
        votedAt: {type: 'datetime'},
        vote_ix: {type: 'int'}
      }, callback
  );
};

exports.down = function (db, callback) {
  db.dropTable('votes', callback);
};