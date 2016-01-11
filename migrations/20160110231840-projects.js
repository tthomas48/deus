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

exports.up = function(db, callback) {
  db.createTable('projects', {
    id: {type: 'int', primaryKey: true, autoIncrement: true},
    org_id: {
      type: 'int', foreignKey: {
        name: 'projects_org_id_fk',
        table: 'orgs',
        rules: {
          onDelete: 'CASCADE',
          onUpdate: 'RESTRICT'
        },
        mapping: 'id'
      }
    },
    name: {type: 'string', length: 100}
  }, callback);
};

exports.down = function(db, callback) {
  db.dropTable('projects', callback);
};
