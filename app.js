var app = angular.module("GitHubProfileViewer", ["ngRoute"]);

app.factory("GithubService", function ($http) {
  const TOKEN = "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";

  return {
    get: function (url) {
      return $http({
        method: "GET",
        url: url,
        headers: {
          Authorization: "token " + TOKEN,
        },
      });
    },

    getRateLimit: function () {
      return this.get("https://api.github.com/rate_limit");
    },
  };
});

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

app.controller(
  "SearchController",
  function ($scope, GithubService, $location, $timeout) {
    $scope.users = [];
    $scope.searchUser = localStorage.getItem("lastSearch") || "";
    $scope.page = 1;
    $scope.loading = false;
    $scope.rateLimit = null;
    $scope.rateLimitError = false;
    $scope.lastId = 0; // For default users pagination
    let searchTimeout;

    function checkRateLimit() {
      GithubService.getRateLimit().then(function (response) {
        $scope.rateLimit = response.data.rate;
        console.log("Rate limit remaining:", $scope.rateLimit.remaining);
      });
    }

    checkRateLimit();

    function fetchDefaultUsers() {
      if ($scope.loading) return;
      $scope.loading = true;

      let url = "https://api.github.com/users?per_page=10";
      // since parameter for pagination if there is an existing id.
      if ($scope.lastId > 0) {
        url += `&since=${$scope.lastId}`;
      }

      GithubService.get(url)
        .then(function (response) {
          if (response.data && response.data.length > 0) {
            const promises = [];

            response.data.forEach((user) => {
              const promise = GithubService.get(
                `https://api.github.com/users/${user.login}`
              ).then((detailsResponse) => {
                const enhancedUser = Object.assign(
                  {},
                  user,
                  detailsResponse.data
                );
                $scope.users.push(enhancedUser);
                // storing the last user for pagination
                if (user.id > $scope.lastId) {
                  $scope.lastId = user.id;
                }
              });

              promises.push(promise);
            });

            return Promise.all(promises);
          }
        })
        .catch(e, (error) => {
          console.log(error);
        })
        .finally(() => {
          $scope.loading = false;
        });
    }

    $scope.$watch("searchUser", function (newVal, oldVal) {
      if (newVal !== oldVal) {
        if (searchTimeout) {
          $timeout.cancel(searchTimeout);
        }
        searchTimeout = $timeout($scope.search, 300);
      }
    });

    $scope.search = function () {
      if (!$scope.searchUser) {
        $scope.page = 1;
        $scope.users = [];
        $scope.lastId = 0;
        fetchDefaultUsers();
        return;
      }

      // Reset for search
      $scope.page = 1;
      $scope.users = [];
      $scope.loadMore();
      localStorage.setItem("lastSearch", $scope.searchUser);
    };

    $scope.loadMore = function () {
      if ($scope.loading || $scope.rateLimitError) return;

      if (!$scope.searchUser) {
        fetchDefaultUsers();
        return;
      }

      $scope.loading = true;

      GithubService.get(
        `https://api.github.com/search/users?q=${$scope.searchUser}&page=${$scope.page}&per_page=12`
      )
        .then(function (response) {
          if (response.data.items && response.data.items.length > 0) {
            const promises = [];

            response.data.items.forEach((user) => {
              const promise = GithubService.get(
                `https://api.github.com/users/${user.login}`
              ).then((detailsResponse) => {
                const enhancedUser = Object.assign(
                  {},
                  user,
                  detailsResponse.data
                );
                $scope.users.push(enhancedUser);
              });

              promises.push(promise);
            });

            Promise.all(promises).then(() => {
              $scope.page++;
              checkRateLimit();
            });
          }
        })
        .catch()
        .finally(() => {
          $scope.loading = false;
        });
    };

    if ($scope.searchUser) {
      $scope.search();
    } else {
      fetchDefaultUsers();
    }

    window.onscroll = function () {
      if (
        window.innerHeight + window.scrollY >=
        document.body.offsetHeight - 100
      ) {
        $scope.$apply($scope.loadMore);
      }
    };

    $scope.viewProfile = function (username) {
      $location.path("/profile/" + username);
    };
  }
);

app.controller(
  "ProfileController",
  function ($scope, GithubService, $routeParams) {
    $scope.selectedUser = null;
    $scope.repos = [];
    $scope.loading = true;
    $scope.error = null;

    GithubService.get("https://api.github.com/users/" + $routeParams.username)
      .then(function (response) {
        $scope.selectedUser = response.data || {
          name: "Unknown",
          login: "N/A",
          bio: "No bio available",
        };
        return GithubService.get(response.data.repos_url);
      })
      .then(function (response) {
        $scope.repos = response.data.length
          ? response.data
          : [{ name: "No repositories found", description: "" }];
      })
      .catch()
      .finally(function () {
        $scope.loading = false;
      });
  }
);
