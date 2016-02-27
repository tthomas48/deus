(function () {
  "use strict";
  module.exports = function(db, models) {
    var EventOption = db.define("event_options", {
      id: {type: 'serial', key: true},
      event_id: {type: 'text'},
      ix: {type: 'number'},
      name: {type: 'text', length: 200},
      img: {type: 'text', length: 200},
      mov: {type: 'text', length: 200},
      snd: {type: 'text', length: 200},
    }, {
      hooks: {
        beforeCreate: function(next) {
          next();
        },
        beforeSave: function(next) {
          next();
        }
      },
      methods: {
        // add in methods
      }
    });
    EventOption.hasOne("event", models.event);
    models.eventoption = EventOption;
  };
})();
