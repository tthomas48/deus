(function () {
  "use strict";
  module.exports = function (db, models) {
    var Event = db.define("events", {
      id: {type: 'text', key: true, length: 48},
      project_id: {type: 'number'},
      name: {type: 'text', length: 200},
      shortname: {type: 'text', length: 32},
      state: {length: 10, type: 'text'},
      timer: {length: 10, type: 'text'},
      view: {length: 200, type: 'text'},
      screen: {length: 200, type: 'text'},
      stage: {length: 200, type: 'text'},
      voting: {type: 'boolean'},
      movie: {length: 200, type: 'text'}
    }, {
      hooks: {
        beforeCreate: function (next) {
          if (!this.id) {
            this.id = "event:" + this.shortname;
          }
          next();
        },
        beforeSave: function (next) {
          next();
        }
      },
      methods: {
      }
    });
    Event.hasOne("project", models.project);
    models.event = Event;
  };
})();
