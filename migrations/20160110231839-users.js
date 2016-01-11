var async = require('async');
'use strict';

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
    db.createTable(
        'users', {
            id: {type: 'int', primaryKey: true, autoIncrement: true},
            org_id: {
                type: 'int', foreignKey: {
                    name: 'users_org_id_fk',
                    table: 'orgs',
                    rules: {
                        onDelete: 'CASCADE',
                        onUpdate: 'RESTRICT'
                    },
                    mapping: 'id'
                }
            },
            username: 'string',
            password: 'string',
            name: 'string',
            email: 'string',
            confirmed: 'boolean',
            createdAt: 'datetime',
            updatedAt: 'datetime'
        }, callback
    );
};

exports.down = function (db, callback) {
    db.dropTable('users', callback);
};

