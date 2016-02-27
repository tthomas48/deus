(function () {
  "use strict";
  module.exports = function(db, models) {
    var TreeLeaf = db.define("tree_leaves", {
      id: {type: 'text', key: true, length: 48},
      ix: {type: 'number'},
      event_id: {type: 'number'},
      leaf: {type: 'number'}
    }, {
      hooks: {
        beforeCreate: function(next) {
        },
        beforeSave: function(next) {
          next();
        }
      },
      methods: {
        // add in methods from old events.js here

      }
    });
    TreeLeaf.hasOne("event", models.event);
    models.treeleaf = TreeLeaf;
  };
})();