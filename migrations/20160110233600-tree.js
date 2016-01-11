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
            db.createTable('tree_leaves', {
                id: {type: 'int', primaryKey: true, autoIncrement: true},
                ix: {type: 'int', default: '0'},
                event_id: {
                    type: 'string',
                    length: '48',
                    foreignKey: {
                        name: 'tree_leaves_event_id_fk',
                        table: 'events',
                        rules: {
                            onDelete: 'CASCADE',
                            onUpdate: 'RESTRICT'
                        },
                        mapping: 'id'
                    }
                },
                leaf: {
                    type: 'int',
                    foreignKey: {
                        name: 'tree_leaves_leaf_id_fk',
                        table: 'tree_leaves',
                        rules: {
                            onDelete: 'CASCADE',
                            onUpdate: 'RESTRICT'
                        },
                        mapping: 'id'
                    }
                }
            }, next);

        }, function (response, next) {
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
                },
                leaf: {
                    type: 'int',
                    foreignKey: {
                        name: 'trees_start_leaf_id_fk',
                        table: 'tree_leaves',
                        rules: {
                            onDelete: 'CASCADE',
                            onUpdate: 'RESTRICT'
                        },
                        mapping: 'id'
                    }
                },
            }, next);
        }
    ], callback);

};

exports.down = function (db, callback) {
    async.waterfall([
        function (next) {
            db.dropTable('trees', next);
        },
        function (response, next) {
            db.dropTable('tree_leaves', next);
        }

    ], callback)
};