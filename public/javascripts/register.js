var app = angular.module('register', ['ngRoute']).controller('RegisterCtrl', function() {
  "use strict";
  console.log('in here!');
  var register = this;
  register.saveUser = function() {
    if (register.registerForm.$valid) {

      console.log("Clicky clicky");
    }
  };
}).directive('passwordVerify', function() {
  "use strict";
  return {
    restrict: "A",
    link: function(scope, element, attrs, ctrl) {
      scope.$watch(function() {
        if (ctrl.registerForm.password.$pristine || ctrl.registerForm.password2.$pristine) {
          ctrl.$setValidity("passwordVerify", true);
          return;
        }
        if (ctrl.registerForm.password !== ctrl.registerForm.password2) {

        }
      });
    }
  }
});