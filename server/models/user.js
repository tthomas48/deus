(function () {
  "use strict";
  var bcrypt = require('bcrypt-node');
  module.exports = function(db, models) {
    var User = db.define("users", {
      id: {type: 'serial', key: true},
      org_id: {type: 'number'},
      username: {type: 'text'},
      password: {type: 'text'},
      name: {type: 'text'},
      email: {type: 'text'},
      confirmed: {type: 'boolean'},
      createdAt: {type: 'date', time: true},
      updatedAt: {type: 'date', time: true}
    }, {
      hooks: {
        beforeCreate: function(next) {
          this.createdAt = new Date();
          this.password = bcrypt.hashSync(this.password);
          next();
        },
        beforeSave: function(next) {
          this.updatedAt = new Date();
          next();
        }
      },
      methods: {
        verifyPassword: function(test) {
          return bcrypt.compareSync(test, this.password);
        }
      }
    });
    User.hasOne("org", models.org);
    models.user = User;
  };
})();
