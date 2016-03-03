(function () {
    "use strict";

    var _ = require('lodash');
    var async = require('async');

    module.exports = function (db, models) {
      var Tree = db.define("trees", {
        id: {type: 'text', key: true, length: 48},
        project_id: {type: 'number'}
      }, {
        hooks: {},
        methods: {
          toJson: function(callback) {

            return this.findRoot(callback);
          },
          loadChildren: function(parents, callback) {
            var that = this;
            async.forEachOf(parents, function (parent, key, next) {
              parent.nodes = [];
              db.driver.execQuery(
                "select cues.id as id, cues.event_id as cue, events.name as cueName,if(events.voting = 1, 'true', 'false') as voting, event_options.name as title " +
                "  from cues, cue_options, events " +
                "  left outer join event_options on event_options.event_id = events.id " +
                " where cues.tree_id = ? " +
                "   and events.project_id = ?" +
                "   and cue_options.dest_cue_id = cues.id " +
                "   and cue_options.parent_cue_id = ?" +
                "   and cue_options.ix = ? " +
                "   and events.id = cues.event_id;",
                [that.id, that.project_id, parent.id, key],
                function (err, data) {
                  if (err) {
                    return next(err);
                  }
                  parent.nodes = data;
                  that.loadChildren(parent.nodes, next);
                  //that.loadChildren(parent.nodes, next);
                  //that.loadChildren(data, next);
                  //that.loadChildren()
                  //data = this.loadChildren()
                }
              );
            }, function(err, data) {
              callback(err, parents);
            });


          },
          findRoot: function(callback) {

            var that = this;
            db.driver.execQuery(
              "select cues.id as id, 'Root' as title, cues.event_id as cue, events.name as cueName, if(events.voting = 1, 'true', 'false') as voting   " +
              "  from cues, cue_options, events " +
              " where cues.tree_id = ? " +
              "   and events.project_id = ?" +
              "   and cue_options.dest_cue_id = cues.id " +
              "   and cue_options.parent_cue_id is null" +
              "   and events.id = cues.event_id;",
              [this.id, that.project_id],
              function (err, root) {
                //data = this.loadChildren()

                that.loadChildren(root, function(err, out) {
                  console.log("HERE***");
                  console.log(out[0].nodes);
                  callback(err, out);
                });

              }
            );

          }
        }

      });
      Tree.hasOne("project", models.project);
      Tree.saveTree = function (treeBody, project_id, callback) {
        console.log(treeBody);

        async.waterfall([
          function (next) {
            models.tree.find({
              project_id: project_id
            }, next);
          }, function (trees, next) {
            if (trees.length === 1) {
              trees[0].remove(next);
            } else {
              next(undefined, {});
            }
          }, function(removed, next) {
            var tree = {
              project_id: project_id,
            };
            models.tree.create(tree, next);
          }, function (tree, next) {
            Tree.saveNodes(tree.id, undefined, [treeBody], next);
          }, function (branches, next) {
            if (branches.length != 1) {
              return next("Missing root branch.");
            }


          }
        ], callback);
      };
      Tree.saveNodes = function (tree_id, parent_cue_id, nodes, callback) {

        var cues = [];
        async.forEachOf(nodes, function (node, key, next) {
          if (!node.cue) {
            return next();
          }
          async.waterfall([
            function (cb) {
              var destCue = {
                event_id: node.cue,
                tree_id: tree_id
              };
              models.cue.create(destCue, cb);
            },
            function (destCue, cb) {
              cues.push(destCue);
              var cueOption = {
                ix: key,
                parent_cue_id: parent_cue_id,
                dest_cue_id: destCue.id
              };
              models.cueoption.create(cueOption, cb);
            },
            function (cueOption, cb) {

              if (node.nodes && node.nodes.length > 0) {
                Tree.saveNodes(tree_id, cueOption.dest_cue_id, node.nodes, cb);
              } else {
                cb();
              }
            }
          ], next);
        }, function(err) {
          callback(err, cues);
        });

      };
      models.tree = Tree;
    };
  })();