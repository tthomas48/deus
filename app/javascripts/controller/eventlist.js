angular.module('deus').controller('EventListCtrl', function($cookieStore, $scope, $location, SimulatorService, ProjectService, EventService) {
  var socket = io.connect();

  function init() {
    socket.on('connect', function() {
      console.log("Connected, lets sign-up for updates about this cue");
      $scope.events.forEach(function(e) {
        socket.emit('event', e.id);
      });
    });
    socket.on('stateUpdate', function(data) {
      console.log("Cue updated.", data);
      $scope.events.forEach(function(e, index) {
        if(e.id === data.id) {
          e.state = data.state;
          $scope.$apply();
        }
      });
    });
  };

  $scope.newProject = {};
  ProjectService.query().$promise.then(function(projects) {
    $scope.projects = projects;

    if (!$cookieStore.get("currentProject") && $scope.projects.length > 0) {
      $cookieStore.put("currentProject", projects[0]);
    }
    $scope.currentProject = $cookieStore.get("currentProject");

    $scope.$watch(
      "currentProject.id", function handleProjectChange() {
        "use strict";
        // should this watch?
        EventService.query({project_id: $scope.currentProject.id}, function(events) {
          $scope.events = events || [];
          init();
        });
      });
  });

  /* PROJECTS */
  $scope.createProject = function(e) {
    "use strict";
    var newProjectName = $scope.newProject.name;
    ProjectService.save({name: newProjectName}).$promise
    .then(function() {
      return ProjectService.query().$promise;
    })
    .then(function(projects) {
      $scope.projects = projects;
      angular.forEach(projects, function(project) {
        if (project && project.name === newProjectName) {
          $scope.currentProject = project;
        }
      });
    })
    .catch(function(error) {
      console.log("Error", error);
    })
    .finally(function() {
        $scope.newProject.name = '';
        jQuery('#createProjectModal').modal('hide');
    });
  };
  $scope.showCreateProject = function() {
    "use strict";
    jQuery('#createProjectModal').modal('show');
  };
  $scope.switchProject = function() {
    "use strict";
    $cookieStore.put("currentProject", $scope.currentProject);
  };
  /* END PROJECTS */

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
          ix: 0,
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
    if(!$scope.event.id) {
      var newEvent = new EventService($scope.event);
      console.log(newEvent);

      newEvent.$save({project_id: $scope.currentProject.id}, function() {
        console.log(newEvent);
        $scope.events.push(newEvent);
      });
    } else {
      $scope.events.forEach(function(e) {
        if(e.id === $scope.event.id) {
          e.$save({project_id: $scope.currentProject.id});
        }
      });
    }
  };
  $scope.delete = function() {
    $scope.events.forEach(function(e, index) {
      if(e.id === $scope.event.id) {
        $scope.event.$delete({
          project_id: $scope.currentProject.id,
          id: $scope.event.id
        }, function() {
          $scope.events.splice(index, 1);
        });
      }
    });
  };
  $scope.addVoteOption = function() {
    $scope.event.voteoptions.push({
      ix: $scope.event.voteoptions.length + 1,
      name: null
    });
  };
  $scope.removeVoteOption = function(vo) {
    $scope.event.voteoptions.splice(vo.ix - 1, 1);
    // need to make sure id values run from 1..x (web service constraint)
    $scope.event.voteoptions.forEach(function(vo, index) {
      vo.ix = index + 1;
    });
  };
  $scope.simulateVotes = function() {
    SimulatorService.save({
      "phonenumber": jQuery("input[name='generate.phonenumber'").val(),
      "options": jQuery("input[name='generate.options'").val(),
      "users": jQuery("input[name='generate.users'").val()
    }, function(response) {
      console.log(response);
    });
  };
});