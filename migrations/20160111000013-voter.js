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
      'voters', {
        id: {type: 'int', primaryKey: true, autoIncrement: true},
        project_id: {
          type: 'int', foreignKey: {
            name: 'voters_project_id_fk',
            table: 'projects',
            rules: {
              onDelete: 'CASCADE',
              onUpdate: 'RESTRICT'
            },
            mapping: 'id'
          }
        },
        phonenumber: { length: 41, type: 'string' },
        votes: { type: 'int' },
        name: { length: 4, type: 'string' }
      }, callback
  );
};

exports.down = function (db, callback) {
  db.dropTable('voters', callback);
};

