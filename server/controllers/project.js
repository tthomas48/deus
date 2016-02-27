"use strict";
var _        = require('lodash');
var async    = require('async');
var utils    = require('./utils');

module.exports = {
  list: function(req, res, callback) {
    var user = req.user;
    async.waterfall([
      function(next) {
        user.getOrg(next);
      },
      function(org, next) {
        req.models.project.find({org_id: org.id}, next);
      }
    ], utils.handleApiResponse(req, res, 200, callback));
  },
  create: function(req, res, callback) {
    var name = req.body.name;
    if (_.isEmpty(name)) {
      var error = new Error("Missing required param 'name'.");
      error.status = 400;
      return callback(error);
    }

    var user = req.user;
    async.waterfall([
      function(next) {
        user.getOrg(next);
      },
      // FIXME: Check for existing project with that name
      function(org, next) {
        req.models.project.create({
          org_id: org.id,
          name: name
        }, next);
      }
    ], utils.handleApiResponse(req, res, 200, callback));
  }
}
