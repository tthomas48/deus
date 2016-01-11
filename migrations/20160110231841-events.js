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
            db.createTable('events', {
                id: {type: 'string', length: 48, primaryKey: true},
                project_id: {
                    type: 'int', foreignKey: {
                        name: 'events_project_id_fk',
                        table: 'projects',
                        rules: {
                            onDelete: 'CASCADE',
                            onUpdate: 'RESTRICT'
                        },
                        mapping: 'id'
                    }
                },
                shortname: {type: 'string', length: 32},
                state: {length: 10, type: 'string'},
                timer: {length: 10, type: 'string'},
                type: {length: 10, type: 'string'},
                view: {length: 200, type: 'string'},
                screen: {length: 200, type: 'string'},
                stage: {length: 200, type: 'string'},
                voting: {type: 'boolean'},
                movie: {length: 200, type: 'string'}
            }, next);
        }, function (response, next) {
            db.createTable('event_options', {
                id: {type: 'int', primaryKey: true, autoIncrement: true},
                event_id: {
                    type: 'string',
                    length: 48,
                    foreignKey: {
                        name: 'event_options_event_id_fk',
                        table: 'events',
                        rules: {
                            onDelete: 'CASCADE',
                            onUpdate: 'RESTRICT'
                        },
                        mapping: 'id'
                    }
                },
                ix: {type: 'int', default: '0'},
                name: {type: 'string', length: 200},
                img: {type: 'string', length: 200},
                mov: {type: 'string', length: 200},
                snd: {type: 'string', length: 200}
            }, next);
        }, function (response, next) {
            db.addIndex('event_options', 'event_options_unique_ix', [
                'event_id',
                'ix'
            ], true, next);
        }
    ], callback);

};

exports.down = function (db, callback) {
    async.waterfall([
        function (next) {
            db.dropTable('event_options', next);
        },
        function (response, next) {
            db.dropTable('events', next);
        }

    ], callback)
};
