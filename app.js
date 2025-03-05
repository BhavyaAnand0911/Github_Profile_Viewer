var app = angular.module("GitHubProfileViewer", []);
app.controller("MainController", function ($scope, $http) {
  $scope.users = [];
  $scope.selectedUser = null;
  $scope.repos = [];

  // Search for users
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
    $http
      .get("https://api.github.com/users/" + username)
      .then(function (response) {
        $scope.selectedUser = response.data;
        return $http.get(response.data.repos_url);
      })
      .then(function (response) {
        $scope.repos = response.data;
      });
  };

  $scope.clearProfile = function () {
    $scope.selectedUser = null;
    $scope.repos = [];
  };
});
