var fs = require('fs');

function findNode(node, name, callback) {
  var i = 0;
  for (i = 0; i < node.nodes.length; i++) {
    if (node.nodes[i].cue == name) {
      callback.call(undefined, node, node.nodes[i]);
    }
    if (node.nodes[i].nodes && node.nodes[i].nodes.length > 0) {
      findNode(node.nodes[i], name, callback);
    }
  }
}

var tree = require('./cuetree.json');
findNode(tree, 'electra-oracle-1', function(parentNode, node) {
  parentNode.nodes = node.nodes;
  console.log(parentNode);
});

var outputFilename = './cuetree.json';
fs.writeFile(outputFilename, JSON.stringify(tree, null, 4), function(err) {
    if(err) {
      console.log(err);
    } else {
      console.log("JSON saved to " + outputFilename);
    }
}); 
