var sys = require('sys')
var exec = require('child_process').exec;

var toInsert = process.argv[2];
var walk     = require('/usr/local/lib/node_modules/walk');
var maxCue   = 0;

if (!toInsert.match(/^\d+$/)) {
  console.log("You must specify a cue to insert");
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
    for(i = maxCue; i >= toInsert; i--) {
      exec("mv " + i + ".html " + (i + 1) + ".html");
    }
});
