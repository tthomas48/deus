(function () {
  "use strict";
  var bcrypt = require('bcrypt-node');
  var uuid = require('uuid');

  module.exports = function(db, models) {
    var UserVerify = db.define("user_verify", {
      id: {type: 'text', key: true},
      user_id: { type: 'number'},
      expiration: {
        type: 'date',
        time: true
      }
    }, {
      hooks: {
        beforeCreate: function (next) {
          var expiration = new Date();
          expiration.setHours(expiration.getHours() + 1);
          this.expiration = expiration;
          this.id = uuid.v4();
          next();
        }
      }
    });
    UserVerify.hasOne("user", models.user);
    models.userverify = UserVerify;
  };
})();
