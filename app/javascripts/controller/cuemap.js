angular.module('deus').controller('CueMapCtrl', function($scope, $location, $filter, $cookieStore, TreeService, EventService, ShowService, CurrentShowService) {
  var socket = io.connect();

  var search = $location.search();
  $scope.projectId = search.projectId;
  TreeService.query({project_id: $scope.projectId}, function(branches) {
    if(!branches[0]) {
      branches = [{
        "id": "0",
        "title": "Root",
        nodes: []
      }];
    }
    $scope.tree = branches;
    //init();
  });
  $scope.changeEventState = function(data) {
    console.log($scope.cueState)
    console.log(data);
    if ($scope.cueState[data] == 'on') {
      $scope.liveVotes = {'0': 0, '1': 0, '2': 0};
      socket.emit('/cue/set', { cue: data, go: 'vote'});
    } else {
      socket.emit('/cue/novote', { cue: data, go: 'vote'});
    }
  };
  $scope.change = function(data) {
    //window.console.log($filter('json')($scope.tree));
    var i, j;
    var currentCue;
    var cueId = data.cue;
    for(j = 0; j < $scope.events.length; j++) {
      var cue = $scope.events[j];
      if(cueId === cue.id) {
        currentCue = cue;
      }
    }
    data.cueName = currentCue.name;
    data.voting = currentCue.voting;
    var oldNodes = data.nodes;
    data.nodes = [];
    for(i = 0; i < currentCue.voteoptions.length; i++) {
      var option = currentCue.voteoptions[i];

      var node = {};
      if (oldNodes && i < oldNodes.length) {
        node = oldNodes[i];
      }
      node.id = data.id + "." + option.ix;
      node.title = option.name;
      data.nodes.push(node);
    }
  };
  $scope.insert = function(data) {
    window.console.log("insert before", data);
    window.console.log($scope.tree);
    /*
     var oldcue = data;
     data.id = data.id + ".i";
     data.nodes = oldcue;
     */
  };
  $scope.delete = function(data) {
    data.nodes = [];
  };
  $scope.startShow = function(data) {
    window.console.log("Starting show");
    var startDate = new Date();
    $scope.currentShow = {
      id: startDate.getTime(),
      start: startDate.toUTCString(),
      current: true,
      cues: [],
      winners: {}
    };
    var newShow = new ShowService($scope.currentShow);
    newShow.$save(function(data) {
      window.console.log("Created new show");
      $scope.currentShow = data;
    });
  };
  $scope.stopShow = function(data) {
    window.console.log("Stopping show");
    $scope.currentShow.current = false;

    var oldShow = new ShowService($scope.currentShow);
    oldShow.$save(function(data) {
      window.console.log("Stopped show");
      $scope.currentShow = undefined;
    });
  };
  $scope.save = function() {
    window.console.log($scope.tree[0]);
    var newTree = new TreeService($scope.tree[0]);
    newTree.$save({project_id: $scope.projectId}, function() {
      $scope.tree = [newTree];
    });
  };
  $scope.add = function(data) {
    var post = data.nodes.length + 1;
    var newName = data.name + '-' + post;
    data.nodes.push({
      name: newName,
      nodes: []
    });
  };
  $scope.setCue = function(id) {
    window.console.log("Setting cue to " + id);
    socket.emit('/cue/set', { cue: id});
    return false;
  };
  $scope.clear = function(view) {
    window.console.log("Emitting a clear" + view);
    socket.emit("/clear", view);
    return false;
  };
  $scope.leaderboard = function(view) {
    window.console.log("Toggling leaderboard");
    socket.emit("/leaderboard");
    return false;
  };

  $scope.dimmer = function(view) {
    window.console.log("Toggling dimmer");
    socket.emit("/dimmer");
    return false;
  };


  $scope.go = function() {
    socket.emit('/cue/go', {});
  };
  $scope.vote = function() {
    $scope.liveVotes = {'0': 0, '1': 0, '2': 0};
    socket.emit('/cue/vote', {});
  };
  $scope.simulate = function() {
    socket.emit('/cue/sim', {});
  };
  $scope.currentProject = $cookieStore.get("currentProject");
  EventService.query({project_id: $scope.currentProject.id}, function(output) {
    $scope.events = output;
  });

  /*
  FIXME: Do we still need current show

  $scope.currentShow = undefined;
  CurrentShowService.get(function(data) {
    $scope.currentShow = data;
  });
   */
  $scope.cueState = [];
  socket.on('connect', function() {
    console.log("Connected, lets sign-up for updates about this show");
  });
  socket.on('winner.display', function(data) {
    console.log(data);
    $scope.lastWinner = data;
  });
  socket.on('vote', function(data) {
    console.log(data);
    if (!$scope.liveVotes) {
      $scope.liveVotes = {};
    }
    if (!$scope.liveVotes[data]) {
      $scope.liveVotes[data] = 0;
    }
    $scope.liveVotes[data]++;
    console.log($scope.liveVotes);
    $scope.$apply();
  });

  socket.on('cue.status', function(data) {
    window.console.log('Cue Status', data);
    window.console.log($scope.cueState);
    window.console.log(data.cue + " setting to " + data.view.state);
    $scope.cueState[data.cue] = data.view.state;
  });
  socket.on('currentShow.update', function(response) {
    window.console.log("Current show updated.", response);
    CurrentShowService.get(function(data) {
      $scope.currentShow = data;
    });
  });
  socket.on('stateUpdate', function(data) {
    console.log("State update", data);
    var allNodes = $('input[event-id=' + data.id.replace(':', '\\:') + ']');
    console.log(allNodes);

    var i;
    for (i = 0; i < allNodes.length; i++) {
      var cueId = $(allNodes[i]).attr('cue-id');
      console.log(cueId);
      $scope.cueState[cueId] = data.state;
      $scope.$apply();
    }
  });

});
