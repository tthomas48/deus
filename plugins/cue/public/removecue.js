var sys = require('sys')
var exec = require('child_process').exec;

var toRemove = process.argv[2];
var walk     = require('/usr/local/lib/node_modules/walk');
var maxCue   = 0;

if (!toRemove.match(/^\d+$/)) {
  console.log("You must specify a cue to remove");
  return;
}

// Walker options
var walker  = walk.walk('./', { followLinks: false });

walker.on('file', function(root, stat, next) {
    // Add this file to the list of files
    if (stat.name.match(/^\d+.html/)) {
      var cue = stat.name.replace(/^(\d+).html/, "$1");
      if (Number(cue) > maxCue) {
        maxCue = Number(cue);
      }
    }
    next();
});

walker.on('end', function() {
    exec("rm " + toRemove + ".html");
    for(i = toRemove; i < maxCue; i++) {
      exec("mv " + (Number(i) + 1) + ".html " + i + ".html");
    }
});
