(function () {
  "use strict";
  module.exports = function(db, models) {
    var Cue = db.define("cues", {
      id: {type: 'text', key: true, length: 48},
      posX: {type: 'number'},
      posY: {type: 'number'},
      event_id: {type: 'text'},
      tree_id: {type: 'number'}
    }, {
      hooks: {
      },
      methods: {
        // add in methods from old events.js here

      }
    });
    Cue.hasOne("event", models.event);
    models.cue = Cue;
  };
})();