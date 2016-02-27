'use strict';

var uuid = require('uuid');

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
    'user_verify', {
      id: {type: 'string', required: true, length: 36, unique: true, key: true},
      user_id: {
        type: 'int',
        foreignKey: {
          name: 'user_verify_user_id_fk',
          table: 'users',
          rules: {
            onDelete: 'CASCADE',
            onUpdate: 'RESTRICT'
          },
          mapping: 'id'
        }
      },
      expiration: {
        type: 'date',
        time: true,
        default: function () {
          var expiration = new Date();
          expiration.setHours(expiration.getHours() + 1);
          return expiration;
        }
      }
    }, callback);
};


exports.down = function (db, callback) {
  db.dropTable('user_verify', callback);
};