"use strict";
var config = require('../config');
var loggedInUsers = {};
module.exports = {
  addLoggedInUser: function (authSession, user) {
    loggedInUsers[authSession] = user;
  },
  getLoggedInUser: exports.getLoggedInUser = function (authSession) {
    return loggedInUsers[authSession];
  },
  removeLoggedInUser: exports.removeLoggedInUser = function (authSession) {
    delete loggedInUsers[authSession];
  }
};