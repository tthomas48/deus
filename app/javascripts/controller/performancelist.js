angular.module('deus').controller('PerformanceListCtrl', function($scope, $location, ShowService) {
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