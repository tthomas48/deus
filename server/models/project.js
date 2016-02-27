(function () {
  "use strict";
  module.exports = function (db, models) {
    var Project = db.define("projects", {
      id: {type: 'serial', key: true},
      org_id: {type: 'number'},
      name: {type: 'text'},
      phonenumber: {type: 'text', length: 12}
    });
    models.project = Project;
  };
})();
