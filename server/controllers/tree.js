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
      function (org, next) {
        req.models.project.find({org_id: org.id}, next);
      },
      function (projects, next) {
        if (projects.length === 0) {
          return next("No matching project found.");
        }
        req.models.tree.find({project_id: projects[0].id}, next);
      },
      function (trees, next) {
        if (trees.length === 0) {
          return next("No matching tree found.");
        }
        trees[0].toJson(next);
      }
    ], utils.handleApiResponse(req, res, 200, callback));
  },
  save: function(req, res, callback) {
    var treeBody = req.body;
    console.log(req.models.tree);
    req.models.tree.saveTree(treeBody, req.params.project_id, utils.handleApiResponse(req, res, 200, callback));
  },
  delete: function(req, res, callback) {
    callback();
  },
  load: function(req, res, callback) {
    callback();
  }
}
