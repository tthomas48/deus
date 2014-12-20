'use strict';
var app = angular.module('votr', ['ngResource', 'ngRoute']);

app.directive('cue', function () {
    return {
        scope: {show: '=', id: '=', name: '='},
        transclude: true,
        restrict: 'E',
        template: '<span class="{{show.cues.indexOf(\'\' +id) >= 0 ? \'triggered-cue text-success\' : \'\'}}">' + 
          '{{ name }}' + 
          '<span ng-show="show.winners[id]">- ({{show.winners[id]["one"]}}/{{show.winners[id]["two"]}}/{{show.winners[id]["three"]}})</span>' +
          '</span>'
    };
});
app.config(function($routeProvider) {
  $routeProvider.when('/', {
    templateUrl: 'event-list.html',
    controller: 'EventListCtrl'
  }).when('/voters', {
    templateUrl: 'voter-list.html',
    controller: 'VoterListCtrl'
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
    data.nodes = [];
    for(i = 0; i < currentCue.voteoptions.length; i++) {
      var option = currentCue.voteoptions[i];
      data.nodes.push({
        id: data.id + "." + option.id,
        title: option.name,
        nodes: []
      });
    }
  };
  $scope.delete = function(data) {
    data.nodes = [];
  }
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
  $scope.go = function(id) {    
    window.console.log("Setting cue to " + id);
    socket.emit('/cue/set', { cue: id});
    return false;
  };
  EventService.query(function(output) {
    $scope.events = output;
  });
  
  $scope.currentShow = undefined;
  CurrentShowService.get(function(data) {
      $scope.currentShow = data;
  });
  socket.on('connect', function() {
    console.log("Connected, lets sign-up for updates about this show");
  });
  socket.on('currentShow.update', function(response) {
    window.console.log("Current show updated.");
    CurrentShowService.get(function(data) {
      $scope.currentShow = data;
    });    
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
      voteoptions: event.voteoptions
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
app.controller('VoterListCtrl', function($scope, $location, VoterService) {
  var socket = io.connect();

  function init() {
    socket.on('connect', function() {
      console.log("Connected, lets sign-up for updates about this voter");
      $scope.voters.forEach(function(v) {
        socket.emit('voter', v._id);
      });
    });
    socket.on('stateUpdate', function(data) {
      console.log("Voter updated.", data);
      $scope.voters.forEach(function(v, index) {
        if(v._id == data.id) {
          v._rev = data.rev;
          v.state = data.state;
          $scope.$apply();
        }
      });
    });
  };
  VoterService.query(function(voters) {
    $scope.voters = voters;
    init();
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
  };
  $scope.save = function() {
    if(!$scope.voter._id) {
      var newVoter = new VoterService($scope.voter);
      newVoter.$save(function() {
        $scope.voters.push(newVoter);
      });
    } else {
      $scope.voters.forEach(function(v) {
        if(v._id === $scope.voter._id) {
          v.$save();
        }
      });
    }
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