'use strict';
var app = angular.module('votr', ['ngResource', 'ngRoute'],  function($rootScopeProvider) { 
  $rootScopeProvider.digestTtl(500); 
});

app.directive('cue', function () {
    return {
        scope: {show: '=', id: '=', name: '='},
        transclude: true,
        restrict: 'E',
        template: '<span class="{{show.cues.indexOf(\'\' +id) >= 0 ? \'triggered-cue text-success\' : \'\'}}">' + 
          '{{ name }}' + 
          '<span ng-show="show.winners[id]">- ({{show.winners[id].results["1"]}}/{{show.winners[id].results["2"]}}/{{show.winners[id].results["3"]}})</span>' +
          '</span>'
    };
});
app.filter('regex', function() {
  return function(input, field, regexField) {
      var out = [];
      if (!input) {
        return;
      }
      
      
      for (var i = 0; i < input.length; i++) {
          var patt = new RegExp(this[regexField], "g");      
          if(patt.test(input[i][field])) {
              out.push(input[i]);
          }
      }      
    return out;
  };
});
app.config(function($routeProvider) {
  $routeProvider.when('/', {
    templateUrl: 'event-list.html',
    controller: 'EventListCtrl'
  }).when('/voters', {
    templateUrl: 'voter-list.html',
    controller: 'VoterListCtrl'
  }).when('/performances', {
    templateUrl: 'performance-list.html',
    controller: 'PerformanceListCtrl'    
  }).when('/manage', {
    templateUrl: 'manage.html',
    controller: 'CueMapCtrl'    
  }).when('/login', {
    templateUrl: 'login.html',
    controller: 'LoginCtrl'
  }).when('/cue-map', {
    templateUrl: 'cue-map.html',
    controller: 'CueMapCtrl'
  })
  // AngularJS does not allow template-less controllers, so we are specifying a
  // template that we know we won't use. Here is more info on this
  // https://github.com/angular/angular.js/issues/1838
  .when('/logout', {
    templateUrl: 'login.html',
    controller: 'LogoutCtrl'
  }).otherwise({
    redirectTo: '/'
  });
});
app.config(function($httpProvider) {
  $httpProvider.interceptors.push(function($rootScope, $location, $q) {
    return {
      'request': function(request) {
        // if we're not logged-in to the AngularJS app, redirect to login page
        $rootScope.loggedIn = $rootScope.loggedIn || $rootScope.username;
        if(!$rootScope.loggedIn && $location.path() != '/login') {
          $location.path('/login');
        }
        return request;
      },
      'responseError': function(rejection) {
        // if we're not logged-in to the web service, redirect to login page
        if(rejection.status === 401 && $location.path() != '/login') {
          $rootScope.loggedIn = false;
          $location.path('/login');
        }
        return $q.reject(rejection);
      }
    };
  });
});
app.factory('EventService', function($resource) {
  return $resource('/api/events/:id');
});
app.factory('VoterService', function($resource) {
  return $resource('/api/voters/:id');
});
app.factory('TreeService', function($resource) {
  return $resource('/api/tree/:id');
});
app.factory('ShowService', function($resource) {
  return $resource('/api/show/:id');
});
app.factory('CurrentShowService', function($resource) {
  return $resource('/api/show/current');
});
app.factory('SessionService', function($resource) {
  return $resource('/api/sessions');
});
app.factory('SimulatorService', function($resource) {
  return $resource('/api/simulator');
});
app.controller('LoginCtrl', function($scope, $rootScope, $location, SessionService) {
  $scope.user = {
    username: '',
    password: ''
  };
  $scope.login = function() {
    $scope.user = SessionService.save($scope.user, function(success) {
      $rootScope.loggedIn = true;
      $location.path('/');
    }, function(error) {
      $scope.loginError = true;
    });
  };
});
app.controller('LogoutCtrl', function($rootScope, $location, SessionService) {
  (new SessionService()).$delete(function(success) {
    $rootScope.loggedIn = false;
    $location.path('/login');
  });
});
app.controller('CueMapCtrl', function($scope, $location, $filter, TreeService, EventService, ShowService, CurrentShowService) {
  var socket = io.connect();
  
  TreeService.query(function(branches) {
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
      if(cueId == cue._id) {
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
      node.id = data.id + "." + option.id;
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
    newTree.$save(function() {
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
  EventService.query(function(output) {
    $scope.events = output;
  });
  
  $scope.currentShow = undefined;
  CurrentShowService.get(function(data) {
      $scope.currentShow = data;
  });
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
app.controller('EventListCtrl', function($scope, $location, SimulatorService, EventService) {
  var socket = io.connect();

  function init() {
    socket.on('connect', function() {
      console.log("Connected, lets sign-up for updates about this cue");
      $scope.events.forEach(function(e) {
        socket.emit('event', e._id);
      });
    });
    socket.on('stateUpdate', function(data) {
      console.log("Cue updated.", data);
      $scope.events.forEach(function(e, index) {
        if(e._id == data.id) {
          e._rev = data.rev;
          e.state = data.state;
          $scope.$apply();
        }
      });
    });
  };
  EventService.query(function(events) {
    $scope.events = events;
    init();
  });
  $scope.editEvent = function(event) {
    $scope.opts = ['on', 'off'];
    if(event === 'new') {
      $scope.newEvent = true;
      $scope.event = {
        name: '',
        shortname: '',
        phonenumber: '',
        state: '',
        timer: 0,
        voteoptions: [{
          id: 1,
          name: ''
        }]
      };
    } else {
      $scope.newEvent = false;
      $scope.event = event;
    }
  };
  $scope.duplicateEvent = function(event) {
    $scope.opts = ['on', 'off'];
    $scope.newEvent = true;
    $scope.event = {
      name: event.name,
      shortname: '',
      phonenumber: event.phonenumber,
      state: 'off',
      timer: event.timer,
      voteoptions: event.voteoptions,
      screen: event.screen,      
      voting: event.voting,
      stage: event.stage,
      view: event.view
      
    };
  };
  $scope.toggleState = function(event) {
    $scope.event = event;
    $scope.save();
  };
  $scope.save = function() {
    if(!$scope.event._id) {
      var newEvent = new EventService($scope.event);
      newEvent.$save(function() {
        $scope.events.push(newEvent);
      });
    } else {
      $scope.events.forEach(function(e) {
        if(e._id === $scope.event._id) {
          e.$save();
        }
      });
    }
  };
  $scope.delete = function() {
    $scope.events.forEach(function(e, index) {
      if(e._id == $scope.event._id) {
        $scope.event.$delete({
          id: $scope.event._id,
          rev: $scope.event._rev
        }, function() {
          $scope.events.splice(index, 1);
        });
      }
    });
  };
  $scope.addVoteOption = function() {
    $scope.event.voteoptions.push({
      id: $scope.event.voteoptions.length + 1,
      name: null
    });
  };
  $scope.removeVoteOption = function(vo) {
    $scope.event.voteoptions.splice(vo.id - 1, 1);
    // need to make sure id values run from 1..x (web service constraint)
    $scope.event.voteoptions.forEach(function(vo, index) {
      vo.id = index + 1;
    });
  };
  $scope.simulateVotes = function() {
    SimulatorService.save({
      "phonenumber": $("input[name='generate.phonenumber'").val(),
      "options": $("input[name='generate.options'").val(),
      "users": $("input[name='generate.users'").val()
    }, function(response) {
      console.log(response);
    });
  };
});
app.controller('PerformanceListCtrl', function($scope, $location, ShowService) {
  $scope.load = function() {
    ShowService.query(function(shows) {
      $scope.shows = shows;

      var i;
      for (i = 0; i < shows.length; i++) {
        if (shows[i]._id == $scope.currentShowId) {
          $scope.currentShow = shows[i];
        }
      }
    });
  };
  ShowService.query(function(shows) {
    $scope.shows = shows;

    $scope.currentShow = shows[0];
    $scope.currentShowId = shows[0]._id;
    var i;
    for (i = 0; i < shows.length; i++) {
      if (shows[i].current) {
        $scope.currentShow = shows[i];
        $scope.currentShowId = shows[i]._id;
      }
    }
  });
});
app.controller('VoterListCtrl', function($scope, $location, $filter, VoterService, ShowService) {
  var socket = io.connect();

  function init() {
    socket.on('connect', function() {
      console.log("Connected, lets sign-up for updates about this voter");
      $scope.voters.forEach(function(v) {
        socket.emit('voter', v._id);
      });
    });
  };
  $scope.addVotes = function(votesToAdd) {
    $scope.filtered.forEach(function(v, index) {
      v.votes = Number(v.votes) + Number(votesToAdd);
      v.$save();
    });
  };
  $scope.setVotes = function(votesToSet) {
    $scope.filtered.forEach(function(v, index) {
      v.votes = Number(votesToSet);
      v.$save();
    });
  };  
  $scope.getData = function(voters, query) {
    var filtered = $filter('regex').bind($scope)(voters, 'phonenumber', 'searchText');
    
    $scope.filtered = [];
    if (filtered.length != voters.length ) {
      $scope.filtered = filtered;
    }
  };
  $scope.sort = function() {
    $scope.voters.sort(function(a, b) {
      return b.votes - a.votes;
    });
    
  };
  $scope.load = function() {
    $scope.voters = [];
    VoterService.query(function(voters) {      
      var i;
      for (i = 0; i < voters.length; i++) {
        if (voters[i].shows && voters[i].shows.indexOf($scope.currentShow) >= 0) {
          $scope.voters.push(voters[i]);
        }
      }
      $scope.sort();
    });    
  };
  ShowService.query(function(shows) {
    $scope.shows = shows;
    
    $scope.currentShow = shows[0]._id;
    var i;
    for (i = 0; i < shows.length; i++) {
      if (shows[i].current) {
        $scope.currentShow = shows[i]._id;
      }
    }
    VoterService.query({show_id: $scope.currentShow}, function(voters) {      
      $scope.voters = voters;
      $scope.sort();
      init();
    });    
  });
  $scope.editVoter = function(voter) {
    $scope.opts = ['on', 'off'];
    if(voter === 'new') {
      $scope.newVoter = true;
      $scope.voter = {
        name: '',
        phonenumber: '',
        votes: 1,
        type: 'voter'
      };
    } else {
      $scope.newVoter = false;
      $scope.voter = voter;
    }
    
    if (!$scope.voter.shows) {
      $scope.voter.shows = [];
    }
    if ($scope.voter.shows.indexOf($scope.currentShow) < 0) {
      $scope.voter.shows.push($scope.currentShow);
    }
  };
  $scope.save = function() {
    if(!$scope.voter._id) {
      var newVoter = new VoterService($scope.voter);
      newVoter.$save(function(err, voter) {
        if (err) {
          alert(err);
          return;
        }
        $scope.voters.push(voter);
      });
    } else {
      $scope.voters.forEach(function(v) {
        if(v._id === $scope.voter._id) {
          v.$save(function(err, voter) {
            if (err) {
              alert(err);
              return;
            }
            v._rev = voter._rev;
          });
        }
      });
    }
    $scope.sort();
  };
  $scope.delete = function() {
    $scope.voters.forEach(function(v, index) {
      if(v._id == $scope.voter._id) {
        $scope.voter.$delete({
          id: $scope.voter._id,
          rev: $scope.voter._rev
        }, function() {
          $scope.voters.splice(index, 1);
        });
      }
    });
  };
});