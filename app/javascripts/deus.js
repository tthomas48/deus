'use strict';
global.jQuery = require('jquery');
require('angular');
require('angular-resource');
require('angular-route');
require('angular-cookies');
require('bootstrap');

var app = angular.module('deus', ['ngResource', 'ngRoute', 'ngCookies'],  function($rootScopeProvider) {
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
app.config(function($httpProvider, $routeProvider) {
  $httpProvider.defaults.withCredentials = true;

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
  }).when('/verify/:verifyid', {
      controller: 'VerifyCtrl',
      templateUrl: 'login.html'
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
  $httpProvider.interceptors.push(function($cookieStore, $rootScope, $location, $q) {
    return {
      'request': function(request) {
        // if we're not logged-in to the AngularJS app, redirect to login page
        var loggedIn = false;
        $httpProvider.defaults.headers.common.Authorization = "";

        var user = $cookieStore.get("user");
        var token = $cookieStore.get("token");
        if (user && token) {
          loggedIn = true;
          $httpProvider.defaults.headers.common.Authorization = "Basic " + window.btoa(user + ":" + token);
        }
        $rootScope.loggedIn = loggedIn;

        if(!loggedIn && $location.path() != '/login' && $location.path().indexOf("/verify/") !== 0) {
          $location.path('/login');
        }

        return request;
      },
      'responseError': function(rejection) {
        // if we're not logged-in to the web service, redirect to login page
        if(rejection.status === 401 && $location.path() != '/login') {
          $cookieStore.put('user', null);
          $cookieStore.put('token', null);
          $location.path('/login');
        }
        return $q.reject(rejection);
      }
    };
  });
});
app.factory('EventService', function($resource) {
  return $resource('/api/projects/:project_id/events/:id');
});
app.factory('ProjectService', function($resource) {
  return $resource('/api/projects/:id');
});
app.factory('VoterService', function($resource) {
  return $resource('/api/voters/:id');
});
app.factory('TreeService', function($resource) {
  return $resource('/api/projects/:project_id/tree/:id');
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
app.factory('VerifyService', function($resource) {
  return $resource('/api/verify', null,
    {
      'verify': { method:'PUT' }
    });
});
app.factory('RegistrationService', function($resource) {
  return $resource('/api/register');
});
app.factory('SimulatorService', function($resource) {
  return $resource('/api/simulator');
});
app.controller('VerifyCtrl', function($scope, $rootScope, $routeParams, $location, VerifyService) {
  VerifyService.verify($routeParams, function (success) {
    $rootScope.loginMsg = "Account confirmed. Please login.";
    $location.path('/login');
  }, function (error) {
    $rootScope.loginError = error.data.error.message;
    $location.path('/login');
  });
});
app.controller('LoginCtrl', function($scope, $rootScope, $cookieStore, $location, SessionService, RegistrationService) {
  $scope.user = {
    username: '',
    password: '',
    password2: ''
  };
  $scope.org = {
    name: ''
  };
  $scope.login = function() {
    $scope.user = SessionService.save($scope.user, function(success) {
      $cookieStore.put('user', success.user);
      $cookieStore.put('token', success.token);
      $location.path('/');
    }, function(error) {
      console.log(error);
      var msg = "Invalid username or password.";
      if (error && error.data && error.data.error && error.data.error.message) {
        msg = error.data.error.message;
      }
      $scope.loginError = msg;
    });
  };
  $scope.register = function() {
    $scope.registerError = '';
    if ($scope.user.password !== $scope.user.password2) {
      $scope.registerError = "Passwords don't match.";
    }
    var params = $scope.user;
    params.orgName = $scope.org.name;
    RegistrationService.save(params, function(success) {
      console.log(success);
    }, function(error) {
      console.error(error);
      var msg = "Unable to register user.";
      if (error && error.data && error.data.error && error.data.error.message) {
        msg = error.data.error.message;
      }
      $scope.registerError = msg;
    });
  };
});
app.controller('LogoutCtrl', function($cookieStore, $rootScope, $location, SessionService) {
  (new SessionService()).$delete(function(success) {
    $cookieStore.put('user', null);
    $cookieStore.put('token', null);
    $location.path('/login');
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
      if (!voters) {
        voters = [];
      }
      $scope.voters = voters;
      $scope.sort();
      init();
    }, function() {
      var voters = [];
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
      newVoter.$save(function(voter) {
        $scope.voters.push(voter);
        $scope.sort();
      }, function(error) {
        alert("Error saving voter. Please refresh page and try again.");
      });
    } else {
      $scope.voters.forEach(function(v) {
        if(v._id === $scope.voter._id) {
          v.$save(function(voter) {
            v._rev = voter._rev;
            $scope.sort();
          }, function(error) {
            alert("Error saving voter. Please refresh page and try again.");
          });
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