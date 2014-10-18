var execSync = require('exec-sync');
var toggle = false;
var cueNumber = 1;
var previousCue = 1;
function cue(name, deps) {
    deps.io.sockets.on('connection', function (socket) {
        socket.on('/cue/reset', function (cmd) {
            var _name;
            console.log("cue toggle", cmd);
            toggle = false;
            cueNumber = 1;
            emitStatus(deps);
        });
        socket.on('/cue/toggle', function (cmd) {
            var _name;
            console.log("cue toggle", cmd);
            toggle = !toggle;
//            deps.io.sockets.emit('/message', "Toggling cue mode: " + (toggle ? 'enabled' : 'disabled'));

            emitStatus(deps);
        });
        socket.on('/cue/go', function (cmd) {
            var _name;
            console.log("cue go", cmd);
            emitStatus(deps, 'go');
        });
        socket.on('/cue/set', function (cmd) {
            console.log("cue set", cmd);
            previousCue = cueNumber;
            cueNumber = cmd.cue;
        });


        /*
        socket.on('/cue/forward', function (cmd) {
             cueNumber++;
             emitStatus(deps);
        });
        */
        socket.on('/cue/backward', function (cmd) {
             cueNumber = previousCue;
             emitStatus(deps);
        });
        socket.on('/cue/winner', function (cmd) {
          console.log("Winner");
          deps.io.sockets.emit('/cue/winner', cmd);          
        });
        
        socket.on('/cue/sim', function (cmd) {
          execSync(__dirname + '/../../scripts/load.sh +15128724637 4 250');
          console.log("Done with load");
        });
    });
}


function emitStatus(deps, go) {
  deps.io.sockets.emit('cue.status', {
    'enabled': toggle,
    'cue': cueNumber,
    'go': go
  });
}

module.exports = cue;
