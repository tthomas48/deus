"use strict";
module.exports = function(io, plugins, emitter) {
  return {
    user: require('./user'),
    project: require('./project'),
    event: require('./event')(io, plugins, emitter),
    tree: require('./tree')
  };
};
