(function () {
  "use strict";
  module.exports = function(db, models) {
    var CueOption = db.define("cue_options", {
      id: {type: 'text', key: true, length: 48},
      ix: {type: 'number'},
      parent_cue_id: {type: 'number'},
      dest_cue_id: {type: 'number'}
    }, {
      hooks: {
      },
      methods: {
        // add in methods from old events.js here

      }
    });
    models.cueoption = CueOption;
  };
})();