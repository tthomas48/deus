var execSync = require('exec-sync');

function cue(name, deps) {
  var events = require('../../models/events')(deps.io);
  var tree = require('../../models/tree')(deps.io);
  
  var findLeaf = function(cueNumber, branches) {
    var i;
    if (!branches) {
      return;
    }
    for(i = 0; i < branches.length; i++) {
      var leaf = branches[i];
      if (leaf.id == cueNumber) {
        return leaf;
      }
      if (leaf.nodes.length > 0) {
        var leaf = findLeaf(cueNumber, leaf.nodes);
        if (leaf) {
          return leaf;
        }
      }
    }
    return undefined;
  };
  
  var findEvent = function(leaf) {
    
  };
  
  
  deps.io.sockets.on('connection', function(socket) {
    var toggle = false;
    var cueNumber = "0";
    var previousCue = 1;
    var emitStatus = function(deps, go) {
      // TODO: Allow changing the template
      tree.list(null, function(err, branches) {
        console.log(branches);
        var leaf = findLeaf(cueNumber, branches);
        var event = findEvent(leaf);
        /*
        var event = findEvent(leaf);
        
        deps.io.sockets.emit('cue.status', {
          'enabled': toggle,
          'cue': cueNumber,
          'go': go,
          'view': event
        });
        */
      });
      /*
      events.findBy('all', {key: ['event:zeustemplate'], reduce:false}, function(err, event) {
        deps.io.sockets.emit('cue.status', {
          'enabled': toggle,
          'cue': cueNumber,
          'go': go,
          'event': event
        });
      });
      */
    };
    socket.on('/cue/reset', function(cmd) {
      var _name;
      console.log("cue toggle", cmd);
      toggle = false;
      cueNumber = "0";
      emitStatus(deps);
    });
    socket.on('/cue/toggle', function(cmd) {
      var _name;
      console.log("cue toggle", cmd);
      toggle = !toggle;
      //            deps.io.sockets.emit('/message', "Toggling cue mode: " + (toggle ? 'enabled' : 'disabled'));
      emitStatus(deps);
    });
    socket.on('/cue/go', function(cmd) {
      var _name;
      console.log("cue go", cmd);
      emitStatus(deps, 'go');
    });
    socket.on('/cue/set', function(cmd) {
      console.log("cue set", cmd);
      previousCue = cueNumber;
      cueNumber = cmd.cue;
    });
    socket.on('/cue/winner', function(cmd) {
      console.log("Winner");
      deps.io.sockets.emit('/cue/winner', cmd);
    });
    socket.on('/cue/sim', function(cmd) {
      execSync(__dirname + '/../../scripts/load.sh +15128724637 4 250');
      console.log("Done with load");
    });
  });
}
module.exports = cue;