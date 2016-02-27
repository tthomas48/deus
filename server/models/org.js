(function () {
  "use strict";
  module.exports = function (db, models) {
    var Org = db.define("orgs", {
      id: {type: 'serial', key: true},
      name: {type: 'text'},
      createdAt: {type: 'date', time: true},
      updatedAt: {type: 'date', time: true}
    }, {
      hooks: {
        beforeCreate: function (next) {
          this.createdAt = new Date();
          next();
        },
        beforeSave: function (next) {
          this.updatedAt = new Date();
          next();
        }
      }
    });
    models.org = Org;
  };
})();