var toggle = false;
var cueNumber = 1;
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
            cueNumber++;
            emitStatus(deps, 'go');
        });
        socket.on('/cue/forward', function (cmd) {
             cueNumber++;
             emitStatus(deps);
        });
        socket.on('/cue/backward', function (cmd) {
             cueNumber--;
             if (cueNumber < 0) {
               cueNumber = 1;
             }
             emitStatus(deps);
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
