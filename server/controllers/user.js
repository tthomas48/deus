"use strict";
var _        = require('lodash');
var async    = require('async');
var utils    = require('./utils');
var jwt      = require('jsonwebtoken');
var mandrill = require('mandrill-api/mandrill');
var config   = require('../config');


module.exports = {
  verify: function(req, res, callback) {
    async.waterfall([
      function(next) {
        var verifyid = req.body.verifyid;
        req.models.userverify.find({id: verifyid}, next);
      },
      function(userverify, next) {
        if (userverify.length !== 1) {
          var error = new Error("Cannot find user to verify.");
          error.statusCode = 401;
          return next(error);
        }
        userverify[0].getUser(function(err, user) {
          if (err) {
            console.log(err);
            return next(err);
          }
          console.log(user);
          userverify[0].remove();
          user.confirmed = true;
          user.save(next);
        });
      },
      function (user, next) {
        next(null, {});
      }
    ], utils.handleApiResponse(req, res, 200, callback));

  },
  sendVerify: function(req, user, callback) {
    async.waterfall([
      function(next) {
        req.models.userverify.find({user_id: user.id}, next);
      },
      function (items, next) {
        if (items.length > 0) {
          return items[0].remove(next);
        }
        next(null, {});
      },
      function (removed, next) {
        req.models.userverify.create({
          user_id: user.id
        }, next);
      },
      function(userverify, next) {
        console.log(userverify);
        userverify.getUser(function(err, user) {
          if (err) {
            return next(err);
          }
          var subject = "Please confirm your email address";
          var url = config.deus.baseUrl + "/admin/#/verify/" + userverify.id;
          var body = "<p>Thank you for signing up for Mt. Olympus.</p>" +
            "<p>Please click on this link to confirm your email address and activate your account.</p>" +
          "<p><a href='" + url + "'>" + url + "</a></p>";
          console.log(body);
          var message = {
            "html": body,
            "subject": subject,
            "from_email": "help@mtolympus.me",
            "to": [ {'email': 'help@mtolympus.me', 'type': 'bcc'} ]
          };
          message.to.push({
            "type": "to",
            "email": user.email
          });


          try {
            var mandrill_client = new mandrill.Mandrill(config.mandrill.api_key);
            mandrill_client.messages.send({"message": message, "async": true}, function(result) {
              console.log(result);
              next();
            });
          } catch(e) {
            if (Array.isArray(e)) {
              e = e[0];
            }
            console.trace(e);
            next(e);
          }
        });
      }
    ], callback);
  },
  register: function (req, res, callback) {
    var username = req.body.username;
    var password = req.body.password;
    var password2 = req.body.password2;
    var name = req.body.name;
    var email = req.body.email;
    var orgName = req.body.orgName;

    if (_.isEmpty(username)) {
      callback(new Error("Username is required."));
    }
    if (_.isEmpty(password) || password !== password2) {
      callback(new Error("Passwords don't match"));
    }
    if (_.isEmpty(name)) {
      callback(new Error("Name is required."));
    }
    if (_.isEmpty(email)) {
      callback(new Error("Email is required."));
    }
    if (_.isEmpty(orgName)) {
      callback(new Error("Organization is required."));
    }
    async.waterfall([
      function (next) {
        req.models.org.find({name: orgName}, function (err, orgs) {
          if (err) {
            return next(err);
          }
          console.log(orgs);
          if (orgs.length === 0) {
            return next();
          }
          next(new Error("Organization name is already taken."));
        });
      },
      function (next) {
        req.models.user.find({email: email}, function (err, users) {
          if (users.length > 0) {
            var error = new Error("Cannot create user. Another user with that email already exists.");
            error.statusCode = 400;
            return next(error);
          }
          next(err);
        });
      },
      function (next) {
        req.models.user.find({username: username}, function (err, users) {
          if (users.length > 0) {
            var error = new Error("Cannot create user. Another user with that username already exists.");
            error.statusCode = 400;
            return next(error);
          }
          next(err);
        });
      },
      function (next) {
        req.models.org.create({"name": orgName}, next);
      },
      function (org, next) {
        req.models.user.create({
          username: username,
          org_id: org.id,
          name: name,
          password: password,
          email: email
        }, next);
      },
      function(user, next) {
        module.exports.sendVerify(req, user, next);
      }
    ], utils.handleApiResponse(req, res, 201, callback));
  },
  login: function (req, res, callback) {
    var username = req.body.username;
    var password = req.body.password;

    async.waterfall([
      function (next) {
        req.models.user.find({username: username}, function (err, users) {
          if (err) {
            return next(err);
          }
          if (users.length === 1) {
            return next(null, users[0]);
          }
          var error = new Error("Invalid username or password.");
          error.statusCode = 401;
          return next(error);
        });
      },
      function (user, next) {
        var error;
        if (!user.confirmed) {
          return module.exports.sendVerify(req, user, function(error) {
            if (error) {
              return next(error);
            }
            error = new Error("Account has not been confirmed. Please check your email for a confirmation message.");
            error.statusCode = 401;
            return next(error);
          });
        }
        if (user.verifyPassword(password)) {
          var token = jwt.sign({ username: user.username, id: user.id}, config.tokensecret, {
            expiresIn: '1 day'
          });
          return next(null, {
            user: user.username,
            token: token
          });
        }
        error = new Error("Invalid username or password.");
        error.statusCode = 401;
        return next(error);
      }
    ], utils.handleApiResponse(req, res, 200, callback));
  },
  logout: function (req, res, callback) {
    req.logout();
    res.status(200).end();
  }
};