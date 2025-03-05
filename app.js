var app = angular.module("GitHubProfileViewer", ["ngRoute"]);

app.config(function ($routeProvider) {
  $routeProvider
    .when("/", {
      templateUrl: "search.html",
      controller: "SearchController",
    })
    .when("/profile/:username", {
      templateUrl: "profile.html",
      controller: "ProfileController",
    })
    .otherwise({
      redirectTo: "/",
    });
});

app.controller("SearchController", function ($scope, $http, $location) {
  $scope.users = [];
  $scope.searchUser = "";

  $scope.search = function () {
    $http
      .get("https://api.github.com/search/users?q=" + $scope.searchUser)
      .then(function (response) {
        $scope.users = response.data.items;

        $scope.users.forEach((user) => {
          $http
            .get("https://api.github.com/users/" + user.login)
            .then(function (detailsResponse) {
              Object.assign(user, detailsResponse.data);
            });
        });
      });
  };

  $scope.viewProfile = function (username) {
    $location.path("/profile/" + username);
  };
});

app.controller(
  "ProfileController",
  function ($scope, $http, $routeParams, $location) {
    $scope.selectedUser = null;
    $scope.repos = [];

    $http
      .get("https://api.github.com/users/" + $routeParams.username)
      .then(function (response) {
        $scope.selectedUser = response.data;
        return $http.get(response.data.repos_url);
      })
      .then(function (response) {
        $scope.repos = response.data;
      });
  }
);
