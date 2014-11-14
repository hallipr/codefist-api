(function() {
  var codefist;

  codefist = angular.module('codefist', ['ngRoute', 'ui.codemirror', 'ui.bootstrap']);

  codefist.config([
    '$routeProvider', function($routeProvider) {
      return $routeProvider.when('/games/', {
        templateUrl: '/app/views/game-list.html',
        controller: 'GameListCtrl'
      }).when('/games/createGame', {
        templateUrl: '/app/views/game-detail.html',
        controller: 'GameDetailCtrl',
        creatingGame: true
      }).when('/games/:gameId', {
        templateUrl: '/app/views/game-detail.html',
        controller: 'GameDetailCtrl',
        creatingGame: false
      }).when('/games/:gameId/bots/:botId', {
        templateUrl: '/app/views/bot-detail.html',
        controller: 'BotDetailCtrl',
        creatingBot: false
      }).when('/games/:gameId/createBot', {
        templateUrl: '/app/views/bot-detail.html',
        controller: 'BotDetailCtrl',
        creatingBot: true
      }).when('/games/:gameId/fight/:botIds', {
        templateUrl: '/app/views/fight-detail.html',
        controller: 'LocalFightCtrl'
      }).when('/matches/:matchId', {
        templateUrl: '/app/views/fight-detail.html',
        controller: 'MatchReplayCtrl'
      }).when('/users/', {
        templateUrl: '/app/views/user-list.html',
        controller: 'UserListCtrl'
      }).when('/users/:userId', {
        templateUrl: '/app/views/user-detail.html',
        controller: 'UserDetailCtrl'
      }).otherwise({
        redirectTo: '/games'
      });
    }
  ]);

  codefist.directive('contenteditable', function() {
    return {
      require: 'ngModel',
      link: function(scope, element, attrs, ctrl) {
        var replaceSelection;
        element.bind('blur', function() {
          return scope.$apply(function() {
            return ctrl.$setViewValue(element.html());
          });
        });
        replaceSelection = function(replacement) {
          var cursorPosition, end, node, original, range, sel, start;
          sel = window.getSelection();
          if (sel.rangeCount === 0) {
            return;
          }
          range = sel.getRangeAt(0);
          original = element.html();
          start = original.substring(0, range.startOffset);
          end = original.substring(range.endOffset);
          cursorPosition = range.startOffset + replacement.length;
          element.html(start + replacement + end);
          range = document.createRange();
          node = element[0].firstChild;
          range.setStart(node, cursorPosition);
          range.setEnd(node, cursorPosition);
          sel.removeAllRanges();
          return sel.addRange(range);
        };
        element.bind('keydown', function(event) {
          switch (event.keyCode) {
            case 13:
              replaceSelection('\n');
              return event.preventDefault();
            case 9:
              replaceSelection('    ');
              return event.preventDefault();
          }
        });
        ctrl.$render = function() {
          return element.html(ctrl.$viewValue);
        };
        return ctrl.$render();
      }
    };
  });

}).call(this);

(function() {
  var codefist;

  codefist = angular.module('codefist');

  codefist.controller('BotDetailCtrl', [
    '$scope', '$routeParams', '$location', 'botService', 'gameService', function($scope, $routeParams, $location, botService, gameService) {
      botService.get($routeParams.gameId, $routeParams.botId).then(function(response) {
        return $scope.bot = response.data;
      });
      gameService.get($routeParams.gameId).then(function(response) {
        return $scope.game = response.data;
      });
      $scope.editorOptions = {
        mode: "javascript",
        lineNumbers: true,
        foldGutter: true,
        gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter', 'CodeMirror-lint-markers'],
        lint: true
      };
      $scope.saveChanges = function() {
        return botService.update($scope.bot);
      };
      $scope.basicEditor = false;
      return $scope.lineCount = function(value) {
        return value.split('\n').length;
      };
    }
  ]);

}).call(this);

(function() {
  var codefist;

  codefist = angular.module('codefist');

  codefist.controller('CreateBotCtrl', [
    '$scope', '$modalInstance', '$routeParams', 'botService', function($scope, $modalInstance, $routeParams, botService) {
      $scope.bot = {
        name: ''
      };
      $scope.ok = function() {
        return botService.create($routeParams.gameId, $scope.bot.name).then(function(response) {
          return $modalInstance.close(response.data);
        }, function(response) {
          var _ref;
          return $scope.error = (response != null ? (_ref = response.data) != null ? _ref.message : void 0 : void 0) || "Error";
        });
      };
      return $scope.cancel = function() {
        return $modalInstance.dismiss('cancel');
      };
    }
  ]);

}).call(this);

(function() {
  var codefist;

  codefist = angular.module('codefist');

  codefist.controller('CreateGameCtrl', [
    '$scope', '$modalInstance', 'gameService', function($scope, $modalInstance, gameService) {
      $scope.game = {
        name: ''
      };
      $scope.ok = function() {
        return gameService.create($scope.game.name).then(function(response) {
          return $modalInstance.close(response.data);
        }, function(response) {
          var _ref;
          return $scope.error = (response != null ? (_ref = response.data) != null ? _ref.message : void 0 : void 0) || "Error";
        });
      };
      return $scope.cancel = function() {
        return $modalInstance.dismiss('cancel');
      };
    }
  ]);

}).call(this);

(function() {
  var codefist;

  codefist = angular.module('codefist');

  codefist.controller('GameDetailCtrl', [
    '$scope', '$modal', '$routeParams', '$location', 'session', 'gameService', 'botService', 'matchService', function($scope, $modal, $routeParams, $location, session, gameService, botService, matchService) {
      var onlyUnique;
      $scope.gameId = $routeParams.gameId;
      gameService.get($scope.gameId).then(function(response) {
        return $scope.game = response.data;
      });
      botService.queryByGame($scope.gameId).then(function(response) {
        var bots;
        bots = response.data;
        $scope.bots = bots;
        return $scope.fightBots = [
          {
            botId: bots[Math.floor(Math.random() * bots.length)].botId
          }, {
            botId: bots[Math.floor(Math.random() * bots.length)].botId
          }
        ];
      });
      matchService.queryByGame($scope.gameId).then(function(response) {
        return $scope.matches = response.data;
      });
      session.initializeScope($scope);
      $scope.scripts = [
        {
          name: 'gameSource',
          label: 'Game Source'
        }, {
          name: 'botSource',
          label: 'Sample Bot Source'
        }, {
          name: 'visualizerSource',
          label: 'Visualizer Source'
        }
      ];
      $scope.activeScriptName = '';
      $scope.editorOptions = {
        mode: 'javascript',
        indentUnit: 4,
        tabMode: 'spaces',
        lineNumbers: true,
        lint: true,
        foldGutter: true,
        gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter', 'CodeMirror-lint-markers']
      };
      $scope.saveChanges = function() {
        return gameService.update($scope.game);
      };
      $scope.editScript = function(name) {
        return $scope.activeScriptName = $scope.activeScriptName === name ? null : name;
      };
      $scope.tabClass = function(name) {
        if ($scope.activeScriptName === name) {
          return 'btn-primary';
        } else {
          return 'btn-default';
        }
      };
      $scope.createBot = function() {
        var modalInstance;
        modalInstance = $modal.open({
          templateUrl: '/app/views/dialogs/create-bot.html',
          controller: 'CreateBotCtrl'
        });
        return modalInstance.result.then(function(bot) {
          return $location.path("games/" + bot.gameId + "/bots/" + bot.botId);
        });
      };
      $scope.fightRanked = function() {
        var botIds;
        botIds = $scope.fightBots.map(function(b) {
          return b.botId;
        });
        return matchService.create($scope.gameId, botIds).then(function(response) {
          return $location.path("/matches/" + response.data);
        });
      };
      $scope.fightLocal = function() {
        var botIds;
        botIds = $scope.fightBots.map(function(b) {
          return b.botId;
        });
        return $location.path("/games/" + $scope.gameId + "/fight/" + (botIds.join()));
      };
      onlyUnique = function(value, index, self) {
        return self.indexOf(value) === index;
      };
      return $scope.canFightRanked = function() {
        return ($scope.fightBots != null) && $scope.fightBots.map(function(b) {
          return b.botId;
        }).filter(onlyUnique).length === $scope.fightBots.length;
      };
    }
  ]);

}).call(this);

(function() {
  var codefist;

  codefist = angular.module('codefist');

  codefist.controller('GameListCtrl', [
    '$scope', '$modal', '$location', 'session', 'gameService', function($scope, $modal, $location, session, gameService) {
      session.initializeScope($scope);
      gameService.query().then(function(response) {
        return $scope.games = response.data;
      });
      return $scope.createGame = function() {
        var modalInstance;
        modalInstance = $modal.open({
          templateUrl: '/app/views/dialogs/create-game.html',
          controller: 'CreateGameCtrl'
        });
        return modalInstance.result.then(function(game) {
          return $location.path("games/" + game.id);
        });
      };
    }
  ]);

}).call(this);

(function() {
  var codefist;

  codefist = angular.module('codefist');

  codefist.controller('LocalFightCtrl', [
    '$scope', 'gameService', 'botService', '$routeParams', '$q', function($scope, gameService, botService, $routeParams, $q) {
      var botIds, botRequests, gameRequest, getConstructor;
      $scope.gameId = $routeParams.gameId;
      $scope.players = [];
      botIds = $routeParams.botIds.split(',');
      $scope.settings = {
        refreshRate: 1000 / 60,
        speed: 1
      };
      gameRequest = gameService.get($scope.gameId).then(function(response) {
        return $scope.game = response.data;
      });
      botRequests = botIds.map(function(botId, index) {
        return botService.get($scope.gameId, botId).then(function(response) {
          return $scope.players[index] = response.data;
        });
      });
      $q.all([gameRequest].concat(botRequests)).then(function(responses) {
        var Game, bot, gameInstance, gameSource, group, groupedBots, i, players, start, visualizerSource, _i, _j, _len, _len1;
        groupedBots = {};
        $scope.players.forEach(function(b) {
          if (!groupedBots.hasOwnProperty(b.botId)) {
            groupedBots[b.botId] = [];
          }
          return groupedBots[b.botId].push(b);
        });
        for (_i = 0, _len = groupedBots.length; _i < _len; _i++) {
          group = groupedBots[_i];
          if (group.length > 1) {
            for (i = _j = 0, _len1 = group.length; _j < _len1; i = ++_j) {
              bot = group[i];
              bot.botId += " (" + i + ")";
            }
          }
        }
        gameSource = $scope.game.gameSource;
        visualizerSource = $scope.game.visualizerSource;
        Game = getConstructor(gameSource, "Game");
        gameInstance = new Game();
        players = $scope.players.map(function(s) {
          return {
            botId: s.botId,
            constructor: getConstructor(s.source, 'Player')
          };
        });
        start = performance.now();
        return gameInstance.play(players, function(playersResults, log) {
          var Visualizer, visualizerInstance;
          log.elapsed = performance.now() - start;
          Visualizer = getConstructor(visualizerSource, "Visualizer");
          visualizerInstance = new Visualizer(log, document.getElementById("playback"), $scope.settings);
          return visualizerInstance.play();
        });
      });
      return getConstructor = function(script, constructorName) {
        var constructorCreator;
        constructorCreator = new Function('global', "return function(){" + script + "; return " + constructorName + ";}.call(global);");
        return constructorCreator({});
      };
    }
  ]);

}).call(this);

(function() {
  var codefist;

  codefist = angular.module('codefist');

  codefist.controller('LoginCtrl', [
    '$scope', 'session', function($scope, session) {
      session.initializeScope($scope);
      $scope.login = function() {
        return session.login();
      };
      return $scope.logout = function() {
        return session.logout();
      };
    }
  ]);

}).call(this);

(function() {
  var codefist;

  codefist = angular.module('codefist');

  codefist.controller('MatchReplayCtrl', [
    '$scope', 'matchService', '$routeParams', '$q', function($scope, matchService, $routeParams, $q) {
      var getConstructor, matchRequest;
      $scope.matchId = $routeParams.matchId;
      $scope.settings = {
        refreshRate: 1000 / 60,
        speed: 1
      };
      matchRequest = matchService.get($scope.matchId).then(function(response) {
        var Visualizer, log, match, visualizerInstance, visualizerSource;
        match = response.data;
        $scope.game = match.game;
        $scope.players = match.players;
        log = JSON.parse(match.log);
        visualizerSource = $scope.game.visualizerSource;
        Visualizer = getConstructor(visualizerSource, "Visualizer");
        visualizerInstance = new Visualizer(log, document.getElementById("playback"), $scope.settings);
        return visualizerInstance.play();
      });
      return getConstructor = function(script, constructorName) {
        var constructorCreator;
        constructorCreator = new Function('global', "return function(){" + script + "; return " + constructorName + ";}.call(global);");
        return constructorCreator({});
      };
    }
  ]);

}).call(this);

(function() {
  var codefist;

  codefist = angular.module('codefist');

  codefist.factory('botService', [
    '$http', 'urls', function($http, urls) {
      return {
        queryByGame: function(gameId) {
          return $http.get(urls.botsByGame(gameId));
        },
        queryByUser: function(userId) {
          return $http.get(urls.botsByUser(userId));
        },
        create: function(gameId, displayName) {
          return $http.post(urls.botsByGame(gameId), JSON.stringify(displayName));
        },
        get: function(gameId, botId) {
          return $http.get(urls.bot(gameId, botId));
        },
        "delete": function(gameId, botId) {
          return $http["delete"](urls.bot(gameId, botId));
        },
        update: function(bot) {
          return $http.put(urls.bot(bot.gameId, bot.botId), bot);
        }
      };
    }
  ]);

}).call(this);

(function() {
  var codefist;

  codefist = angular.module('codefist');

  codefist.factory('gameService', [
    '$http', 'urls', function($http, urls) {
      return {
        query: function() {
          return $http.get(urls.games);
        },
        gamesByUser: function(userId) {
          return $http.get(urls.gamesByUser(userId));
        },
        create: function(displayName) {
          return $http.post(urls.games, JSON.stringify(displayName));
        },
        get: function(id) {
          return $http.get(urls.game(id));
        },
        "delete": function(id) {
          return $http["delete"](urls.game(id));
        },
        update: function(game) {
          return $http.put(urls.game(game.id), game);
        }
      };
    }
  ]);

}).call(this);

(function() {
  var codefist;

  codefist = angular.module('codefist');

  codefist.factory('matchService', [
    '$http', 'urls', function($http, urls) {
      return {
        queryByGame: function(gameId) {
          return $http.get(urls.matchesByGame(gameId));
        },
        queryByBot: function(gameId, botId) {
          return $http.get(urls.matchesByBot(gameId, botId));
        },
        create: function(gameId, botIds) {
          return $http.post(urls.matchesByGame(gameId), JSON.stringify(botIds));
        },
        get: function(matchId) {
          return $http.get(urls.match(matchId));
        }
      };
    }
  ]);

}).call(this);

(function() {
  var codefist,
    __slice = [].slice;

  codefist = angular.module('codefist');

  codefist.factory('session', [
    '$http', '$rootScope', '$window', 'urls', function($http, $rootScope, $window, urls) {
      var session;
      session = {
        user: {},
        isLoggedIn: function() {
          return !!this.user.enabled;
        },
        isLoading: function() {
          return !!this.request || !!this.loginWindow;
        },
        login: function(width, height) {
          var left, top, windowParams;
          if (width == null) {
            width = 1000;
          }
          if (height == null) {
            height = 650;
          }
          height = Math.min(height, screen.height);
          width = Math.min(width, screen.width);
          left = screen.width > width ? Math.round((screen.width / 2) - (width / 2)) : 0;
          top = screen.height > height ? Math.round((screen.height / 2) - (height / 2)) : 0;
          windowParams = "left=" + left + ",top=" + top + ",width=" + width + ",height=" + height + ",personalbar=0,toolbar=0,scrollbars=1,resizable=1";
          this.loginWindow = window.open(urls.login, 'Sign in with Github', windowParams);
          if (this.loginWindow) {
            return this.loginWindow.focus();
          }
        },
        logout: function() {
          var self;
          self = this;
          return $http({
            url: urls.logout
          }).then(function() {
            return self.processLoginResult({
              success: false
            });
          })["catch"](function() {
            return console.error.apply(console, ['Error logging out'].concat(__slice.call(arguments)));
          });
        },
        processLoginResult: function(result) {
          if (result.success) {
            return this.user = {
              name: result.userDisplayName,
              id: result.userId,
              enabled: result.enabled
            };
          } else {
            return this.user = {};
          }
        },
        checkLoginStatus: function() {
          var self;
          self = this;
          return $http({
            url: urls.loginStatus,
            method: 'POST'
          }).then(function(response) {
            return self.processLoginResult(response.data);
          });
        },
        initializeScope: function(scope) {
          var self;
          self = this;
          scope.isLoggedIn = function() {
            return self.isLoggedIn();
          };
          scope.isLoading = function() {
            return self.isLoading();
          };
          return scope.username = function() {
            return self.user.name;
          };
        }
      };
      $window._handleLoginResponse = function(result) {
        $rootScope.$apply(function() {
          return session.processLoginResult(result);
        });
        return delete session.loginWindow;
      };
      session.checkLoginStatus();
      setInterval(session.checkLoginStatus.bind(session), 1000 * 60 * 5);
      return session;
    }
  ]);

}).call(this);

(function() {
  var codefist;

  codefist = angular.module('codefist');

  codefist.factory('urls', [
    '$http', function($http) {
      return {
        users: '/api/users',
        user: function(userId) {
          return "/api/users/" + userId;
        },
        games: '/api/games',
        gamesByUser: function(userId) {
          return "/api/users/" + userId + "/games";
        },
        game: function(gameId) {
          return "/api/games/" + gameId;
        },
        botsByGame: function(gameId) {
          return "/api/games/" + gameId + "/bots";
        },
        botsByUser: function(userId) {
          return "/api/users/" + userId + "/bots";
        },
        bot: function(gameId, botId) {
          return "/api/games/" + gameId + "/bots/" + botId;
        },
        matchesByGame: function(gameId) {
          return "/api/games/" + gameId + "/matches";
        },
        matchesByBot: function(gameId, botId) {
          return "/api/games/" + gameId + "/bots/" + botId + "/matches";
        },
        match: function(matchId) {
          return "/api/matches/" + matchId;
        },
        logout: '/security/logout',
        login: '/security/login',
        loginStatus: '/security/loginStatus'
      };
    }
  ]);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5jb2ZmZWUiLCJjb250cm9sbGVycy9ib3REZXRhaWwuY29mZmVlIiwiY29udHJvbGxlcnMvY3JlYXRlQm90LmNvZmZlZSIsImNvbnRyb2xsZXJzL2NyZWF0ZUdhbWUuY29mZmVlIiwiY29udHJvbGxlcnMvZ2FtZURldGFpbC5jb2ZmZWUiLCJjb250cm9sbGVycy9nYW1lTGlzdC5jb2ZmZWUiLCJjb250cm9sbGVycy9sb2NhbEZpZ2h0LmNvZmZlZSIsImNvbnRyb2xsZXJzL2xvZ2luQ3RybC5jb2ZmZWUiLCJjb250cm9sbGVycy9tYXRjaFJlcGxheS5jb2ZmZWUiLCJzZXJ2aWNlcy9ib3RTZXJ2aWNlLmNvZmZlZSIsInNlcnZpY2VzL2dhbWVTZXJ2aWNlLmNvZmZlZSIsInNlcnZpY2VzL21hdGNoU2VydmljZS5jb2ZmZWUiLCJzZXJ2aWNlcy9zZXNzaW9uLmNvZmZlZSIsInNlcnZpY2VzL3VybHMuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQSxRQUFBOztBQUFBLEVBQUEsUUFBQSxHQUFXLE9BQU8sQ0FBQyxNQUFSLENBQWUsVUFBZixFQUEyQixDQUFDLFNBQUQsRUFBWSxlQUFaLEVBQTZCLGNBQTdCLENBQTNCLENBQVgsQ0FBQTs7QUFBQSxFQUVBLFFBQVEsQ0FBQyxNQUFULENBQWdCO0lBQUMsZ0JBQUQsRUFBbUIsU0FBQyxjQUFELEdBQUE7YUFDL0IsY0FDSSxDQUFDLElBREwsQ0FDVSxTQURWLEVBRVE7QUFBQSxRQUFBLFdBQUEsRUFBYSwyQkFBYjtBQUFBLFFBQ0EsVUFBQSxFQUFZLGNBRFo7T0FGUixDQUtJLENBQUMsSUFMTCxDQUtVLG1CQUxWLEVBTVE7QUFBQSxRQUFBLFdBQUEsRUFBYSw2QkFBYjtBQUFBLFFBQ0EsVUFBQSxFQUFZLGdCQURaO0FBQUEsUUFFQSxZQUFBLEVBQWMsSUFGZDtPQU5SLENBVUksQ0FBQyxJQVZMLENBVVUsZ0JBVlYsRUFXUTtBQUFBLFFBQUEsV0FBQSxFQUFhLDZCQUFiO0FB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QWpDO1FBQUEsQ0FYaEI7QUFBQSxRQVlBLFlBQUEsRUFBZSxTQUFDLE1BQUQsRUFBUyxLQUFULEdBQUE7aUJBQW9CLGFBQUEsR0FBYSxNQUFiLEdBQW9CLFFBQXBCLEdBQTRCLEtBQTVCLEdBQWtDLFdBQXREO1FBQUEsQ0FaZjtBQUFBLFFBYUEsS0FBQSxFQUFRLFNBQUMsT0FBRCxHQUFBO2lCQUFjLGVBQUEsR0FBZSxRQUE3QjtRQUFBLENBYlI7QUFBQSxRQWVBLE1BQUEsRUFBUSxrQkFmUjtBQUFBLFFBZ0JBLEtBQUEsRUFBTyxpQkFoQlA7QUFBQSxRQWlCQSxXQUFBLEVBQWEsdUJBakJiO1FBRCtCO0lBQUEsQ0FBVjtHQUF6QixDQUZBLENBQUE7QUFBQSIsImZpbGUiOiJhcHAuanMiLCJzb3VyY2VzQ29udGVudCI6WyJjb2RlZmlzdCA9IGFuZ3VsYXIubW9kdWxlICdjb2RlZmlzdCcsIFsnbmdSb3V0ZScsICd1aS5jb2RlbWlycm9yJywgJ3VpLmJvb3RzdHJhcCddXHJcblxyXG5jb2RlZmlzdC5jb25maWcgWyckcm91dGVQcm92aWRlcicsICgkcm91dGVQcm92aWRlcikgLT5cclxuICAgICRyb3V0ZVByb3ZpZGVyXHJcbiAgICAgICAgLndoZW4gJy9nYW1lcy8nLFxyXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogJy9hcHAvdmlld3MvZ2FtZS1saXN0Lmh0bWwnXHJcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdHYW1lTGlzdEN0cmwnXHJcblxyXG4gICAgICAgIC53aGVuICcvZ2FtZXMvY3JlYXRlR2FtZScsXHJcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAnL2FwcC92aWV3cy9nYW1lLWRldGFpbC5odG1sJ1xyXG4gICAgICAgICAgICBjb250cm9sbGVyOiAnR2FtZURldGFpbEN0cmwnXHJcbiAgICAgICAgICAgIGNyZWF0aW5nR2FtZTogdHJ1ZVxyXG5cclxuICAgICAgICAud2hlbiAnL2dhbWVzLzpnYW1lSWQnLFxyXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogJy9hcHAvdmlld3MvZ2FtZS1kZXRhaWwuaHRtbCdcclxuICAgICAgICAgICAgY29udHJvbGxlcjogJ0dhbWVEZXRhaWxDdHJsJ1xyXG4gICAgICAgICAgICBjcmVhdGluZ0dhbWU6IGZhbHNlXHJcblxyXG4gICAgICAgIC53aGVuICcvZ2FtZXMvOmdhbWVJZC9ib3RzLzpib3RJZCcsXHJcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAnL2FwcC92aWV3cy9ib3QtZGV0YWlsLmh0bWwnXHJcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdCb3REZXRhaWxDdHJsJyxcclxuICAgICAgICAgICAgY3JlYXRpbmdCb3Q6IGZhbHNlXHJcblxyXG4gICAgICAgIC53aGVuICcvZ2FtZXMvOmdhbWVJZC9jcmVhdGVCb3QnLFxyXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogJy9hcHAvdmlld3MvYm90LWRldGFpbC5odG1sJ1xyXG4gICAgICAgICAgICBjb250cm9sbGVyOiAnQm90RGV0YWlsQ3RybCdcclxuICAgICAgICAgICAgY3JlYXRpbmdCb3Q6IHRydWVcclxuXHJcbiAgICAgICAgLndoZW4gJy9nYW1lcy86Z2FtZUlkL2ZpZ2h0Lzpib3RJZHMnLFxyXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogJy9hcHAvdmlld3MvZmlnaHQtZGV0YWlsLmh0bWwnXHJcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdMb2NhbEZpZ2h0Q3RybCdcclxuXHJcbiAgICAgICAgLndoZW4gJy9tYXRjaGVzLzptYXRjaElkJyxcclxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICcvYXBwL3ZpZXdzL2ZpZ2h0LWRldGFpbC5odG1sJ1xyXG4gICAgICAgICAgICBjb250cm9sbGVyOiAnTWF0Y2hSZXBsYXlDdHJsJ1xyXG5cclxuICAgICAgICAud2hlbiAnL3VzZXJzLycsXHJcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAnL2FwcC92aWV3cy91c2VyLWxpc3QuaHRtbCdcclxuICAgICAgICAgICAgY29udHJvbGxlcjogJ1VzZXJMaXN0Q3RybCdcclxuXHJcbiAgICAgICAgLndoZW4gJy91c2Vycy86dXNlcklkJyxcclxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICcvYXBwL3ZpZXdzL3VzZXItZGV0YWlsLmh0bWwnXHJcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdVc2VyRGV0YWlsQ3RybCdcclxuXHJcbiAgICAgICAgLm90aGVyd2lzZVxyXG4gICAgICAgICAgICByZWRpcmVjdFRvOiAnL2dhbWVzJ1xyXG5dXHJcblxyXG5jb2RlZmlzdC5kaXJlY3RpdmUoJ2NvbnRlbnRlZGl0YWJsZScsIC0+XHJcbiAgICByZXF1aXJlOiAnbmdNb2RlbCcsXHJcbiAgICBsaW5rOiAoc2NvcGUsIGVsZW1lbnQsIGF0dHJzLCBjdHJsKSAtPiBcclxuICAgICAgICAjIHZpZXcgLT4gbW9kZWxcclxuICAgICAgICBlbGVtZW50LmJpbmQoJ2JsdXInLCAtPiBcclxuICAgICAgICAgICAgc2NvcGUuJGFwcGx5KCAtPiBjdHJsLiRzZXRWaWV3VmFsdWUoZWxlbWVudC5odG1sKCkpKVxyXG4gICAgICAgIClcclxuXHJcbiAgICAgICAgcmVwbGFjZVNlbGVjdGlvbiA9IChyZXBsYWNlbWVudCkgLT5cclxuICAgICAgICAgICAgc2VsID0gd2luZG93LmdldFNlbGVjdGlvbigpXHJcbiAgICAgICAgICAgIGlmIHNlbC5yYW5nZUNvdW50ID09IDBcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuXHJcbiAgICAgICAgICAgIHJhbmdlID0gc2VsLmdldFJhbmdlQXQoMClcclxuXHJcbiAgICAgICAgICAgIG9yaWdpbmFsID0gZWxlbWVudC5odG1sKClcclxuICAgICAgICAgICAgc3RhcnQgPSBvcmlnaW5hbC5zdWJzdHJpbmcoMCwgcmFuZ2Uuc3RhcnRPZmZzZXQpXHJcbiAgICAgICAgICAgIGVuZCA9IG9yaWdpbmFsLnN1YnN0cmluZyhyYW5nZS5lbmRPZmZzZXQpXHJcbiAgICAgICAgICAgIGN1cnNvclBvc2l0aW9uID0gcmFuZ2Uuc3RhcnRPZmZzZXQgKyByZXBsYWNlbWVudC5sZW5ndGhcclxuXHJcbiAgICAgICAgICAgIGVsZW1lbnQuaHRtbChzdGFydCArIHJlcGxhY2VtZW50ICsgZW5kKVxyXG5cclxuICAgICAgICAgICAgcmFuZ2UgPSBkb2N1bWVudC5jcmVhdGVSYW5nZSgpXHJcbiAgICAgICAgICAgIG5vZGUgPSBlbGVtZW50WzBdLmZpcnN0Q2hpbGRcclxuICAgICAgICAgICAgcmFuZ2Uuc2V0U3RhcnQobm9kZSwgY3Vyc29yUG9zaXRpb24pXHJcbiAgICAgICAgICAgIHJhbmdlLnNldEVuZChub2RlLCBjdXJzb3JQb3NpdGlvbilcclxuICAgICAgICAgICAgc2VsLnJlbW92ZUFsbFJhbmdlcygpXHJcbiAgICAgICAgICAgIHNlbC5hZGRSYW5nZShyYW5nZSk7ICAgICAgICAgICBcclxuXHJcbiAgICAgICAgZWxlbWVudC5iaW5kKCdrZXlkb3duJywgKGV2ZW50KSAtPlxyXG4gICAgICAgICAgICBzd2l0Y2goZXZlbnQua2V5Q29kZSlcclxuICAgICAgICAgICAgICAgIHdoZW4gMTNcclxuICAgICAgICAgICAgICAgICAgICByZXBsYWNlU2VsZWN0aW9uKCdcXG4nKVxyXG4gICAgICAgICAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KClcclxuICAgICAgICAgICAgICAgIHdoZW4gOSAjIHRhYiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAgIHJlcGxhY2VTZWxlY3Rpb24oJyAgICAnKVxyXG4gICAgICAgICAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KClcclxuICAgICAgICApXHJcblxyXG4gICAgICAgICMgbW9kZWwgLT4gdmlld1xyXG4gICAgICAgIGN0cmwuJHJlbmRlciA9IC0+IGVsZW1lbnQuaHRtbChjdHJsLiR2aWV3VmFsdWUpXHJcblxyXG4gICAgICAgICMgbG9hZCBpbml0IHZhbHVlIGZyb20gRE9NXHJcbiAgICAgICAgY3RybC4kcmVuZGVyKClcclxuKVxyXG4iLCJjb2RlZmlzdCA9IGFuZ3VsYXIubW9kdWxlICdjb2RlZmlzdCdcclxuXHJcbmNvZGVmaXN0LmNvbnRyb2xsZXIgJ0JvdERldGFpbEN0cmwnLCBbJyRzY29wZScsICckcm91dGVQYXJhbXMnLCAnJGxvY2F0aW9uJywgJ2JvdFNlcnZpY2UnLCAnZ2FtZVNlcnZpY2UnLCAoJHNjb3BlLCAkcm91dGVQYXJhbXMsICRsb2NhdGlvbiwgYm90U2VydmljZSwgZ2FtZVNlcnZpY2UpIC0+XHJcbiAgICBib3RTZXJ2aWNlLmdldCgkcm91dGVQYXJhbXMuZ2FtZUlkLCAkcm91dGVQYXJhbXMuYm90SWQpXHJcbiAgICAgICAudGhlbigocmVzcG9uc2UpIC0+ICRzY29wZS5ib3QgPSByZXNwb25zZS5kYXRhKSAgICBcclxuXHJcbiAgICBnYW1lU2VydmljZS5nZXQoJHJvdXRlUGFyYW1zLmdhbWVJZClcclxuICAgICAgIC50aGVuKChyZXNwb25zZSkgLT4gJHNjb3BlLmdhbWUgPSByZXNwb25zZS5kYXRhKSAgICBcclxuXHJcbiAgICAkc2NvcGUuZWRpdG9yT3B0aW9ucyA9XHJcbiAgICAgICAgbW9kZTogXCJqYXZhc2NyaXB0XCJcclxuICAgICAgICBsaW5lTnVtYmVyczogdHJ1ZVxyXG4gICAgICAgIGZvbGRHdXR0ZXI6IHRydWVcclxuICAgICAgICBndXR0ZXJzOiBbJ0NvZGVNaXJyb3ItbGluZW51bWJlcnMnLCAnQ29kZU1pcnJvci1mb2xkZ3V0dGVyJywgJ0NvZGVNaXJyb3ItbGludC1tYXJrZXJzJ11cclxuICAgICAgICBsaW50OiB0cnVlXHJcblxyXG4gICAgJHNjb3BlLnNhdmVDaGFuZ2VzID0gLT4gYm90U2VydmljZS51cGRhdGUoJHNjb3BlLmJvdClcclxuXHJcbiAgICAkc2NvcGUuYmFzaWNFZGl0b3IgPSBmYWxzZTtcclxuXHJcbiAgICAkc2NvcGUubGluZUNvdW50ID0gKHZhbHVlKSAtPiB2YWx1ZS5zcGxpdCgnXFxuJykubGVuZ3RoXHJcbl0iLCJjb2RlZmlzdCA9IGFuZ3VsYXIubW9kdWxlICdjb2RlZmlzdCdcclxuXHJcbmNvZGVmaXN0LmNvbnRyb2xsZXIgJ0NyZWF0ZUJvdEN0cmwnLCBbJyRzY29wZScsICckbW9kYWxJbnN0YW5jZScsICckcm91dGVQYXJhbXMnLCAnYm90U2VydmljZScsICgkc2NvcGUsICRtb2RhbEluc3RhbmNlLCAkcm91dGVQYXJhbXMsIGJvdFNlcnZpY2UpIC0+XHJcbiAgICAkc2NvcGUuYm90ID0geyBuYW1lOiAnJyB9O1xyXG5cclxuICAgICRzY29wZS5vayA9IC0+IFxyXG4gICAgICAgIGJvdFNlcnZpY2UuY3JlYXRlKCRyb3V0ZVBhcmFtcy5nYW1lSWQsICRzY29wZS5ib3QubmFtZSlcclxuICAgICAgICAgICAgLnRoZW4oXHJcbiAgICAgICAgICAgICAgICAocmVzcG9uc2UpIC0+ICRtb2RhbEluc3RhbmNlLmNsb3NlKHJlc3BvbnNlLmRhdGEpLFxyXG4gICAgICAgICAgICAgICAgKHJlc3BvbnNlKSAtPiAkc2NvcGUuZXJyb3IgPSByZXNwb25zZT8uZGF0YT8ubWVzc2FnZSB8fCBcIkVycm9yXCJcclxuICAgICAgICAgICAgKVxyXG4gIFxyXG4gICAgJHNjb3BlLmNhbmNlbCA9IC0+ICRtb2RhbEluc3RhbmNlLmRpc21pc3MoJ2NhbmNlbCcpXHJcbl0iLCJjb2RlZmlzdCA9IGFuZ3VsYXIubW9kdWxlICdjb2RlZmlzdCdcclxuXHJcbmNvZGVmaXN0LmNvbnRyb2xsZXIgJ0NyZWF0ZUdhbWVDdHJsJywgWyckc2NvcGUnLCAnJG1vZGFsSW5zdGFuY2UnLCAnZ2FtZVNlcnZpY2UnLCAoJHNjb3BlLCAkbW9kYWxJbnN0YW5jZSwgZ2FtZVNlcnZpY2UpIC0+XHJcbiAgICAkc2NvcGUuZ2FtZSA9IHsgbmFtZTogJycgfTtcclxuXHJcbiAgICAkc2NvcGUub2sgPSAtPiBcclxuICAgICAgICBnYW1lU2VydmljZS5jcmVhdGUoJHNjb3BlLmdhbWUubmFtZSlcclxuICAgICAgICAgICAgLnRoZW4oXHJcbiAgICAgICAgICAgICAgICAocmVzcG9uc2UpIC0+ICRtb2RhbEluc3RhbmNlLmNsb3NlKHJlc3BvbnNlLmRhdGEpLFxyXG4gICAgICAgICAgICAgICAgKHJlc3BvbnNlKSAtPiAkc2NvcGUuZXJyb3IgPSByZXNwb25zZT8uZGF0YT8ubWVzc2FnZSB8fCBcIkVycm9yXCJcclxuICAgICAgICAgICAgKVxyXG5cclxuICAgICRzY29wZS5jYW5jZWwgPSAtPiAkbW9kYWxJbnN0YW5jZS5kaXNtaXNzKCdjYW5jZWwnKVxyXG5dIiwiY29kZWZpc3QgPSBhbmd1bGFyLm1vZHVsZSAnY29kZWZpc3QnXHJcblxyXG5jb2RlZmlzdC5jb250cm9sbGVyICdHYW1lRGV0YWlsQ3RybCcsIFsnJHNjb3BlJywgJyRtb2RhbCcsICckcm91dGVQYXJhbXMnLCAnJGxvY2F0aW9uJywgJ3Nlc3Npb24nLCAnZ2FtZVNlcnZpY2UnLCAnYm90U2VydmljZScsICdtYXRjaFNlcnZpY2UnLCAoJHNjb3BlLCAkbW9kYWwsICRyb3V0ZVBhcmFtcywgJGxvY2F0aW9uLCBzZXNzaW9uLCBnYW1lU2VydmljZSwgYm90U2VydmljZSwgbWF0Y2hTZXJ2aWNlKSAtPlxyXG4gICAgJHNjb3BlLmdhbWVJZCA9ICRyb3V0ZVBhcmFtcy5nYW1lSWQgICAgICAgIFxyXG4gICAgXHJcbiAgICBnYW1lU2VydmljZS5nZXQoJHNjb3BlLmdhbWVJZClcclxuICAgICAgICAudGhlbigocmVzcG9uc2UpIC0+ICRzY29wZS5nYW1lID0gcmVzcG9uc2UuZGF0YSlcclxuXHJcbiAgICBib3RTZXJ2aWNlLnF1ZXJ5QnlHYW1lKCRzY29wZS5nYW1lSWQpXHJcbiAgICAgICAgLnRoZW4oKHJlc3BvbnNlKSAtPiBcclxuICAgICAgICAgICAgYm90cyA9IHJlc3BvbnNlLmRhdGFcclxuICAgICAgICAgICAgJHNjb3BlLmJvdHMgPSBib3RzXHJcbiAgICAgICAgICAgICRzY29wZS5maWdodEJvdHMgPSBbXHJcbiAgICAgICAgICAgICAgICB7IGJvdElkOiBib3RzW01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSpib3RzLmxlbmd0aCldLmJvdElkIH1cclxuICAgICAgICAgICAgICAgIHsgYm90SWQ6IGJvdHNbTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpKmJvdHMubGVuZ3RoKV0uYm90SWQgfVxyXG4gICAgICAgICAgICBdXHJcbiAgICAgICAgKVxyXG5cclxuICAgIG1hdGNoU2VydmljZS5xdWVyeUJ5R2FtZSgkc2NvcGUuZ2FtZUlkKVxyXG4gICAgICAgIC50aGVuKChyZXNwb25zZSkgLT4gJHNjb3BlLm1hdGNoZXMgPSByZXNwb25zZS5kYXRhKTtcclxuXHJcbiAgICBzZXNzaW9uLmluaXRpYWxpemVTY29wZSgkc2NvcGUpO1xyXG5cclxuICAgICRzY29wZS5zY3JpcHRzID0gW1xyXG4gICAgICAgIHsgbmFtZTonZ2FtZVNvdXJjZScsIGxhYmVsOidHYW1lIFNvdXJjZScgfVxyXG4gICAgICAgIHsgbmFtZTonYm90U291cmNlJywgbGFiZWw6J1NhbXBsZSBCb3QgU291cmNlJyB9XHJcbiAgICAgICAgeyBuYW1lOid2aXN1YWxpemVyU291cmNlJywgbGFiZWw6J1Zpc3VhbGl6ZXIgU291cmNlJyB9XHJcbiAgICBdXHJcblxyXG4gICAgJHNjb3BlLmFjdGl2ZVNjcmlwdE5hbWUgPSAnJ1xyXG5cclxuICAgICRzY29wZS5lZGl0b3JPcHRpb25zID1cclxuICAgICAgICBtb2RlOiAnamF2YXNjcmlwdCdcclxuICAgICAgICBpbmRlbnRVbml0OiA0XHJcbiAgICAgICAgdGFiTW9kZTogJ3NwYWNlcycgICAgICAgIFxyXG4gICAgICAgIGxpbmVOdW1iZXJzOiB0cnVlXHJcbiAgICAgICAgbGludDogdHJ1ZVxyXG4gICAgICAgIGZvbGRHdXR0ZXI6IHRydWVcclxuICAgICAgICBndXR0ZXJzOiBbJ0NvZGVNaXJyb3ItbGluZW51bWJlcnMnLCAnQ29kZU1pcnJvci1mb2xkZ3V0dGVyJywgJ0NvZGVNaXJyb3ItbGludC1tYXJrZXJzJ11cclxuICAgIFxyXG4gICAgJHNjb3BlLnNhdmVDaGFuZ2VzID0gLT4gZ2FtZVNlcnZpY2UudXBkYXRlKCRzY29wZS5nYW1lKVxyXG5cclxuICAgICRzY29wZS5lZGl0U2NyaXB0ID0gKG5hbWUpIC0+ICRzY29wZS5hY3RpdmVTY3JpcHROYW1lID0gaWYgJHNjb3BlLmFjdGl2ZVNjcmlwdE5hbWUgPT0gbmFtZSB0aGVuIG51bGwgZWxzZSBuYW1lXHJcblxyXG4gICAgJHNjb3BlLnRhYkNsYXNzID0gKG5hbWUpIC0+IGlmICRzY29wZS5hY3RpdmVTY3JpcHROYW1lID09IG5hbWUgdGhlbiAnYnRuLXByaW1hcnknIGVsc2UgJ2J0bi1kZWZhdWx0JyAgXHJcblxyXG4gICAgJHNjb3BlLmNyZWF0ZUJvdCA9IC0+XHJcbiAgICAgICAgbW9kYWxJbnN0YW5jZSA9ICRtb2RhbC5vcGVuXHJcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAnL2FwcC92aWV3cy9kaWFsb2dzL2NyZWF0ZS1ib3QuaHRtbCdcclxuICAgICAgICAgICAgY29udHJvbGxlcjogJ0NyZWF0ZUJvdEN0cmwnICAgIFxyXG5cclxuICAgICAgICBtb2RhbEluc3RhbmNlLnJlc3VsdC50aGVuKChib3QpIC0+ICRsb2NhdGlvbi5wYXRoKFwiZ2FtZXMvI3tib3QuZ2FtZUlkfS9ib3RzLyN7Ym90LmJvdElkfVwiKSlcclxuXHJcbiAgICAkc2NvcGUuZmlnaHRSYW5rZWQgPSAtPiBcclxuICAgICAgICBib3RJZHMgPSAkc2NvcGUuZmlnaHRCb3RzLm1hcCgoYiktPmIuYm90SWQpXHJcbiAgICAgICAgbWF0Y2hTZXJ2aWNlLmNyZWF0ZSgkc2NvcGUuZ2FtZUlkLCBib3RJZHMpXHJcbiAgICAgICAgICAgIC50aGVuKChyZXNwb25zZSkgLT4gJGxvY2F0aW9uLnBhdGgoXCIvbWF0Y2hlcy8je3Jlc3BvbnNlLmRhdGF9XCIpKVxyXG4gICAgXHJcbiAgICAkc2NvcGUuZmlnaHRMb2NhbCA9IC0+IFxyXG4gICAgICAgIGJvdElkcyA9ICRzY29wZS5maWdodEJvdHMubWFwKChiKS0+Yi5ib3RJZClcclxuICAgICAgICAkbG9jYXRpb24ucGF0aChcIi9nYW1lcy8jeyRzY29wZS5nYW1lSWR9L2ZpZ2h0LyN7Ym90SWRzLmpvaW4oKX1cIilcclxuXHJcbiAgICBvbmx5VW5pcXVlID0gKHZhbHVlLCBpbmRleCwgc2VsZikgLT4gc2VsZi5pbmRleE9mKHZhbHVlKSA9PSBpbmRleFxyXG5cclxuICAgICRzY29wZS5jYW5GaWdodFJhbmtlZCA9IC0+ICRzY29wZS5maWdodEJvdHM/IGFuZCAkc2NvcGUuZmlnaHRCb3RzLm1hcCgoYiktPmIuYm90SWQpLmZpbHRlcihvbmx5VW5pcXVlKS5sZW5ndGggPT0gJHNjb3BlLmZpZ2h0Qm90cy5sZW5ndGhcclxuXSIsImNvZGVmaXN0ID0gYW5ndWxhci5tb2R1bGUgJ2NvZGVmaXN0J1xyXG5cclxuY29kZWZpc3QuY29udHJvbGxlciAnR2FtZUxpc3RDdHJsJywgWyckc2NvcGUnLCAnJG1vZGFsJywgJyRsb2NhdGlvbicsJ3Nlc3Npb24nLCAnZ2FtZVNlcnZpY2UnLCAoJHNjb3BlLCAkbW9kYWwsICRsb2NhdGlvbiwgc2Vzc2lvbiwgZ2FtZVNlcnZpY2UpIC0+IFxyXG4gICAgc2Vzc2lvbi5pbml0aWFsaXplU2NvcGUoJHNjb3BlKTtcclxuXHJcbiAgICBnYW1lU2VydmljZS5xdWVyeSgpXHJcbiAgICAgICAudGhlbigocmVzcG9uc2UpIC0+ICRzY29wZS5nYW1lcyA9IHJlc3BvbnNlLmRhdGEpICAgIFxyXG5cclxuICAgICRzY29wZS5jcmVhdGVHYW1lID0gLT5cclxuICAgICAgICBtb2RhbEluc3RhbmNlID0gJG1vZGFsLm9wZW5cclxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICcvYXBwL3ZpZXdzL2RpYWxvZ3MvY3JlYXRlLWdhbWUuaHRtbCdcclxuICAgICAgICAgICAgY29udHJvbGxlcjogJ0NyZWF0ZUdhbWVDdHJsJyAgICAgICAgICAgIFxyXG5cclxuICAgICAgICBtb2RhbEluc3RhbmNlLnJlc3VsdC50aGVuKChnYW1lKSAtPiAkbG9jYXRpb24ucGF0aChcImdhbWVzLyN7Z2FtZS5pZH1cIikpXHJcbl0iLCJjb2RlZmlzdCA9IGFuZ3VsYXIubW9kdWxlICdjb2RlZmlzdCdcclxuXHJcbmNvZGVmaXN0LmNvbnRyb2xsZXIgJ0xvY2FsRmlnaHRDdHJsJywgWyckc2NvcGUnLCAnZ2FtZVNlcnZpY2UnLCAnYm90U2VydmljZScsICckcm91dGVQYXJhbXMnLCAnJHEnLCAoJHNjb3BlLCBnYW1lU2VydmljZSwgYm90U2VydmljZSwgJHJvdXRlUGFyYW1zLCAkcSkgLT5cclxuICAgICRzY29wZS5nYW1lSWQgPSAkcm91dGVQYXJhbXMuZ2FtZUlkXHJcbiAgICAkc2NvcGUucGxheWVycyA9IFtdXHJcbiAgICBib3RJZHMgPSAkcm91dGVQYXJhbXMuYm90SWRzLnNwbGl0KCcsJylcclxuICAgICRzY29wZS5zZXR0aW5ncyA9IHJlZnJlc2hSYXRlOiAxMDAwIC8gNjAsIHNwZWVkOiAxXHJcblxyXG4gICAgZ2FtZVJlcXVlc3QgPSBnYW1lU2VydmljZS5nZXQoJHNjb3BlLmdhbWVJZCkudGhlbigocmVzcG9uc2UpIC0+ICRzY29wZS5nYW1lID0gcmVzcG9uc2UuZGF0YSlcclxuICAgIGJvdFJlcXVlc3RzID0gYm90SWRzLm1hcCgoYm90SWQsIGluZGV4KSAtPiAgYm90U2VydmljZS5nZXQoJHNjb3BlLmdhbWVJZCwgYm90SWQpLnRoZW4oKHJlc3BvbnNlKSAtPiAkc2NvcGUucGxheWVyc1tpbmRleF0gPSByZXNwb25zZS5kYXRhKSlcclxuXHJcbiAgICAkcS5hbGwoW2dhbWVSZXF1ZXN0XS5jb25jYXQoYm90UmVxdWVzdHMpKVxyXG4gICAgICAgIC50aGVuKChyZXNwb25zZXMpIC0+ICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGdyb3VwZWRCb3RzID0ge31cclxuXHJcbiAgICAgICAgICAgICRzY29wZS5wbGF5ZXJzLmZvckVhY2goKGIpIC0+IFxyXG4gICAgICAgICAgICAgICAgaWYgIWdyb3VwZWRCb3RzLmhhc093blByb3BlcnR5KGIuYm90SWQpIHRoZW4gZ3JvdXBlZEJvdHNbYi5ib3RJZF0gPSBbXVxyXG4gICAgICAgICAgICAgICAgZ3JvdXBlZEJvdHNbYi5ib3RJZF0ucHVzaChiKVxyXG4gICAgICAgICAgICApXHJcblxyXG4gICAgICAgICAgICBmb3IgZ3JvdXAgaW4gZ3JvdXBlZEJvdHMgd2hlbiBncm91cC5sZW5ndGggPiAxXHJcbiAgICAgICAgICAgICAgICBmb3IgYm90LCBpIGluIGdyb3VwXHJcbiAgICAgICAgICAgICAgICAgICAgYm90LmJvdElkICs9IFwiICgje2l9KVwiXHJcblxyXG4gICAgICAgICAgICBnYW1lU291cmNlID0gJHNjb3BlLmdhbWUuZ2FtZVNvdXJjZVxyXG4gICAgICAgICAgICB2aXN1YWxpemVyU291cmNlID0gJHNjb3BlLmdhbWUudmlzdWFsaXplclNvdXJjZVxyXG5cclxuICAgICAgICAgICAgR2FtZSA9IGdldENvbnN0cnVjdG9yKGdhbWVTb3VyY2UsIFwiR2FtZVwiKVxyXG4gICAgICAgICAgICBnYW1lSW5zdGFuY2UgPSBuZXcgR2FtZSgpXHJcblxyXG4gICAgICAgICAgICBwbGF5ZXJzID0gJHNjb3BlLnBsYXllcnMubWFwIChzKSAtPlxyXG4gICAgICAgICAgICAgICAgYm90SWQ6IHMuYm90SWRcclxuICAgICAgICAgICAgICAgIGNvbnN0cnVjdG9yOiBnZXRDb25zdHJ1Y3RvcihzLnNvdXJjZSwgJ1BsYXllcicpXHJcblxyXG4gICAgICAgICAgICBzdGFydCA9IHBlcmZvcm1hbmNlLm5vdygpXHJcbiAgICAgICAgICAgIGdhbWVJbnN0YW5jZS5wbGF5KHBsYXllcnMsIChwbGF5ZXJzUmVzdWx0cywgbG9nKSAtPiBcclxuICAgICAgICAgICAgICAgIGxvZy5lbGFwc2VkID0gcGVyZm9ybWFuY2Uubm93KCkgLSBzdGFydFxyXG4gICAgICAgICAgICAgICAgVmlzdWFsaXplciA9IGdldENvbnN0cnVjdG9yKHZpc3VhbGl6ZXJTb3VyY2UsIFwiVmlzdWFsaXplclwiKVxyXG4gICAgICAgICAgICAgICAgdmlzdWFsaXplckluc3RhbmNlID0gbmV3IFZpc3VhbGl6ZXIobG9nLCBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInBsYXliYWNrXCIpLCAkc2NvcGUuc2V0dGluZ3MpXHJcbiAgICAgICAgICAgICAgICB2aXN1YWxpemVySW5zdGFuY2UucGxheSgpXHJcbiAgICAgICAgICAgIClcclxuICAgICAgICApXHJcblxyXG4gICAgZ2V0Q29uc3RydWN0b3IgPSAoc2NyaXB0LCBjb25zdHJ1Y3Rvck5hbWUpIC0+XHJcbiAgICAgICAgY29uc3RydWN0b3JDcmVhdG9yID0gbmV3IEZ1bmN0aW9uKCdnbG9iYWwnLCBcInJldHVybiBmdW5jdGlvbigpeyN7c2NyaXB0fTsgcmV0dXJuICN7Y29uc3RydWN0b3JOYW1lfTt9LmNhbGwoZ2xvYmFsKTtcIilcclxuICAgICAgICByZXR1cm4gY29uc3RydWN0b3JDcmVhdG9yKHt9KVxyXG5dIiwiY29kZWZpc3QgPSBhbmd1bGFyLm1vZHVsZSAnY29kZWZpc3QnXHJcblxyXG5jb2RlZmlzdC5jb250cm9sbGVyICdMb2dpbkN0cmwnLCBbJyRzY29wZScsICdzZXNzaW9uJywgKCRzY29wZSwgc2Vzc2lvbikgLT5cclxuICAgIHNlc3Npb24uaW5pdGlhbGl6ZVNjb3BlKCRzY29wZSlcclxuXHJcbiAgICAkc2NvcGUubG9naW4gPSAtPiBzZXNzaW9uLmxvZ2luKClcclxuICAgICRzY29wZS5sb2dvdXQgPSAtPiBzZXNzaW9uLmxvZ291dCgpICAgIFxyXG5dIiwiY29kZWZpc3QgPSBhbmd1bGFyLm1vZHVsZSAnY29kZWZpc3QnXHJcblxyXG5jb2RlZmlzdC5jb250cm9sbGVyICdNYXRjaFJlcGxheUN0cmwnLCBbJyRzY29wZScsICdtYXRjaFNlcnZpY2UnLCAnJHJvdXRlUGFyYW1zJywgJyRxJywgKCRzY29wZSwgbWF0Y2hTZXJ2aWNlLCAkcm91dGVQYXJhbXMsICRxKSAtPlxyXG4gICAgJHNjb3BlLm1hdGNoSWQgPSAkcm91dGVQYXJhbXMubWF0Y2hJZFxyXG5cclxuICAgICRzY29wZS5zZXR0aW5ncyA9IHJlZnJlc2hSYXRlOiAxMDAwIC8gNjAsIHNwZWVkOiAxXHJcblxyXG4gICAgbWF0Y2hSZXF1ZXN0ID0gbWF0Y2hTZXJ2aWNlLmdldCgkc2NvcGUubWF0Y2hJZClcclxuICAgICAgICAudGhlbigocmVzcG9uc2UpIC0+IFxyXG4gICAgICAgICAgICBtYXRjaCA9IHJlc3BvbnNlLmRhdGFcclxuICAgICAgICAgICAgJHNjb3BlLmdhbWUgPSBtYXRjaC5nYW1lXHJcbiAgICAgICAgICAgICRzY29wZS5wbGF5ZXJzID0gbWF0Y2gucGxheWVyc1xyXG5cclxuICAgICAgICAgICAgbG9nID0gSlNPTi5wYXJzZShtYXRjaC5sb2cpXHJcbiAgICAgICAgICAgIHZpc3VhbGl6ZXJTb3VyY2UgPSAkc2NvcGUuZ2FtZS52aXN1YWxpemVyU291cmNlXHJcbiAgICAgICAgICAgIFZpc3VhbGl6ZXIgPSBnZXRDb25zdHJ1Y3Rvcih2aXN1YWxpemVyU291cmNlLCBcIlZpc3VhbGl6ZXJcIilcclxuICAgICAgICAgICAgdmlzdWFsaXplckluc3RhbmNlID0gbmV3IFZpc3VhbGl6ZXIobG9nLCBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInBsYXliYWNrXCIpLCAkc2NvcGUuc2V0dGluZ3MpXHJcbiAgICAgICAgICAgIHZpc3VhbGl6ZXJJbnN0YW5jZS5wbGF5KCkgICAgICAgICAgICBcclxuICAgICAgICApXHJcblxyXG4gICAgZ2V0Q29uc3RydWN0b3IgPSAoc2NyaXB0LCBjb25zdHJ1Y3Rvck5hbWUpIC0+XHJcbiAgICAgICAgY29uc3RydWN0b3JDcmVhdG9yID0gbmV3IEZ1bmN0aW9uKCdnbG9iYWwnLCBcInJldHVybiBmdW5jdGlvbigpeyN7c2NyaXB0fTsgcmV0dXJuICN7Y29uc3RydWN0b3JOYW1lfTt9LmNhbGwoZ2xvYmFsKTtcIilcclxuICAgICAgICByZXR1cm4gY29uc3RydWN0b3JDcmVhdG9yKHt9KVxyXG5dIiwiY29kZWZpc3QgPSBhbmd1bGFyLm1vZHVsZSAnY29kZWZpc3QnXHJcblxyXG5jb2RlZmlzdC5mYWN0b3J5ICdib3RTZXJ2aWNlJywgWyckaHR0cCcsICd1cmxzJywgKCRodHRwLCB1cmxzKSAtPlxyXG4gICAgcXVlcnlCeUdhbWU6IChnYW1lSWQpIC0+ICRodHRwLmdldCh1cmxzLmJvdHNCeUdhbWUoZ2FtZUlkKSlcclxuICAgIHF1ZXJ5QnlVc2VyOiAodXNlcklkKSAtPiAkaHR0cC5nZXQodXJscy5ib3RzQnlVc2VyKHVzZXJJZCkpXHJcbiAgICBjcmVhdGU6IChnYW1lSWQsIGRpc3BsYXlOYW1lKSAtPiAkaHR0cC5wb3N0KHVybHMuYm90c0J5R2FtZShnYW1lSWQpLCBKU09OLnN0cmluZ2lmeShkaXNwbGF5TmFtZSkpXHJcbiAgICBnZXQ6IChnYW1lSWQsIGJvdElkKSAtPiAkaHR0cC5nZXQodXJscy5ib3QoZ2FtZUlkLCBib3RJZCkpXHJcbiAgICBkZWxldGU6IChnYW1lSWQsIGJvdElkKSAtPiAkaHR0cC5kZWxldGUodXJscy5ib3QoZ2FtZUlkLCBib3RJZCkpXHJcbiAgICB1cGRhdGU6IChib3QpIC0+ICRodHRwLnB1dCh1cmxzLmJvdChib3QuZ2FtZUlkLCBib3QuYm90SWQpLCBib3QpXHJcbl0iLCJjb2RlZmlzdCA9IGFuZ3VsYXIubW9kdWxlICdjb2RlZmlzdCdcclxuXHJcbmNvZGVmaXN0LmZhY3RvcnkgJ2dhbWVTZXJ2aWNlJywgWyckaHR0cCcsICd1cmxzJywgKCRodHRwLCB1cmxzKSAtPlxyXG4gICAgcXVlcnk6ICgpIC0+ICRodHRwLmdldCh1cmxzLmdhbWVzKVxyXG4gICAgZ2FtZXNCeVVzZXI6ICh1c2VySWQpIC0+ICRodHRwLmdldCh1cmxzLmdhbWVzQnlVc2VyKHVzZXJJZCkpXHJcbiAgICBjcmVhdGU6IChkaXNwbGF5TmFtZSkgLT4gJGh0dHAucG9zdCh1cmxzLmdhbWVzLCBKU09OLnN0cmluZ2lmeShkaXNwbGF5TmFtZSkpXHJcbiAgICBnZXQ6IChpZCkgLT4gJGh0dHAuZ2V0KHVybHMuZ2FtZShpZCkpXHJcbiAgICBkZWxldGU6IChpZCkgLT4gJGh0dHAuZGVsZXRlKHVybHMuZ2FtZShpZCkpXHJcbiAgICB1cGRhdGU6IChnYW1lKSAtPiAkaHR0cC5wdXQodXJscy5nYW1lKGdhbWUuaWQpLCBnYW1lKVxyXG5dIiwiY29kZWZpc3QgPSBhbmd1bGFyLm1vZHVsZSAnY29kZWZpc3QnXHJcblxyXG5jb2RlZmlzdC5mYWN0b3J5ICdtYXRjaFNlcnZpY2UnLCBbJyRodHRwJywgJ3VybHMnLCAoJGh0dHAsIHVybHMpIC0+XHJcbiAgICBxdWVyeUJ5R2FtZTogKGdhbWVJZCkgLT4gJGh0dHAuZ2V0KHVybHMubWF0Y2hlc0J5R2FtZShnYW1lSWQpKVxyXG4gICAgcXVlcnlCeUJvdDogKGdhbWVJZCwgYm90SWQpIC0+ICRodHRwLmdldCh1cmxzLm1hdGNoZXNCeUJvdChnYW1lSWQsIGJvdElkKSlcclxuICAgIGNyZWF0ZTogKGdhbWVJZCwgYm90SWRzKSAtPiAkaHR0cC5wb3N0KHVybHMubWF0Y2hlc0J5R2FtZShnYW1lSWQpLCBKU09OLnN0cmluZ2lmeShib3RJZHMpKVxyXG4gICAgZ2V0OiAobWF0Y2hJZCkgLT4gJGh0dHAuZ2V0KHVybHMubWF0Y2gobWF0Y2hJZCkpXHJcbl0iLCJjb2RlZmlzdCA9IGFuZ3VsYXIubW9kdWxlICdjb2RlZmlzdCdcclxuXHJcbmNvZGVmaXN0LmZhY3RvcnkgJ3Nlc3Npb24nLCBbJyRodHRwJywgJyRyb290U2NvcGUnLCAnJHdpbmRvdycsICd1cmxzJywgKCRodHRwLCAkcm9vdFNjb3BlLCAkd2luZG93LCB1cmxzKSAtPlxyXG4gICAgc2Vzc2lvbiA9XHJcbiAgICAgICAgdXNlcjoge31cclxuXHJcbiAgICAgICAgaXNMb2dnZWRJbjogLT4gISFAdXNlci5lbmFibGVkXHJcblxyXG4gICAgICAgIGlzTG9hZGluZzogLT4gISFAcmVxdWVzdCBvciAhIUBsb2dpbldpbmRvd1xyXG4gICAgICAgIFxyXG4gICAgICAgIGxvZ2luOiAod2lkdGggPSAxMDAwLCBoZWlnaHQgPSA2NTApIC0+XHJcbiAgICAgICAgICAgIGhlaWdodCA9IE1hdGgubWluKGhlaWdodCwgc2NyZWVuLmhlaWdodClcclxuICAgICAgICAgICAgd2lkdGggPSBNYXRoLm1pbih3aWR0aCwgc2NyZWVuLndpZHRoKVxyXG4gICAgICAgICAgICBsZWZ0ID0gaWYgKHNjcmVlbi53aWR0aCA+IHdpZHRoKSB0aGVuIE1hdGgucm91bmQoKHNjcmVlbi53aWR0aCAvIDIpIC0gKHdpZHRoIC8gMikpIGVsc2UgMFxyXG4gICAgICAgICAgICB0b3AgPSBpZiAoc2NyZWVuLmhlaWdodCA+IGhlaWdodCkgdGhlbiBNYXRoLnJvdW5kKChzY3JlZW4uaGVpZ2h0IC8gMikgLSAoaGVpZ2h0IC8gMikpIGVsc2UgMFxyXG4gICAgICAgIFxyXG4gICAgICAgICAgICB3aW5kb3dQYXJhbXMgPSBcImxlZnQ9I3tsZWZ0fSx0b3A9I3t0b3B9LHdpZHRoPSN7d2lkdGh9LGhlaWdodD0je2hlaWdodH0scGVyc29uYWxiYXI9MCx0b29sYmFyPTAsc2Nyb2xsYmFycz0xLHJlc2l6YWJsZT0xXCJcclxuICAgICAgICBcclxuICAgICAgICAgICAgQGxvZ2luV2luZG93ID0gd2luZG93Lm9wZW4odXJscy5sb2dpbiwgJ1NpZ24gaW4gd2l0aCBHaXRodWInLCB3aW5kb3dQYXJhbXMpXHJcblxyXG4gICAgICAgICAgICBpZiBAbG9naW5XaW5kb3cgdGhlbiBAbG9naW5XaW5kb3cuZm9jdXMoKVxyXG4gICAgXHJcbiAgICAgICAgbG9nb3V0OiAtPlxyXG4gICAgICAgICAgICBzZWxmID0gQFxyXG4gICAgICBcclxuICAgICAgICAgICAgJGh0dHAodXJsOiB1cmxzLmxvZ291dClcclxuICAgICAgICAgICAgICAgIC50aGVuKCAtPiBzZWxmLnByb2Nlc3NMb2dpblJlc3VsdChzdWNjZXNzOiBmYWxzZSkpXHJcbiAgICAgICAgICAgICAgICAuY2F0Y2goIC0+IGNvbnNvbGUuZXJyb3IgJ0Vycm9yIGxvZ2dpbmcgb3V0JywgYXJndW1lbnRzLi4uKVxyXG5cclxuICAgICAgICBwcm9jZXNzTG9naW5SZXN1bHQ6IChyZXN1bHQpIC0+IFxyXG4gICAgICAgICAgICBpZiByZXN1bHQuc3VjY2Vzc1xyXG4gICAgICAgICAgICB0aGVuIEB1c2VyID0gXHJcbiAgICAgICAgICAgICAgICAgICAgbmFtZTogcmVzdWx0LnVzZXJEaXNwbGF5TmFtZVxyXG4gICAgICAgICAgICAgICAgICAgIGlkOiByZXN1bHQudXNlcklkXHJcbiAgICAgICAgICAgICAgICAgICAgZW5hYmxlZDogcmVzdWx0LmVuYWJsZWRcclxuICAgICAgICAgICAgZWxzZSBAdXNlciA9IHt9XHJcblxyXG4gICAgICAgIGNoZWNrTG9naW5TdGF0dXM6IC0+XHJcbiAgICAgICAgICAgIHNlbGYgPSBAXHJcblxyXG4gICAgICAgICAgICAkaHR0cCh1cmw6IHVybHMubG9naW5TdGF0dXMsIG1ldGhvZDogJ1BPU1QnKVxyXG4gICAgICAgICAgICAgICAgLnRoZW4oKHJlc3BvbnNlKSAtPiBzZWxmLnByb2Nlc3NMb2dpblJlc3VsdChyZXNwb25zZS5kYXRhKSlcclxuXHJcbiAgICAgICAgaW5pdGlhbGl6ZVNjb3BlOiAoc2NvcGUpIC0+IFxyXG4gICAgICAgICAgICBzZWxmID0gQFxyXG5cclxuICAgICAgICAgICAgc2NvcGUuaXNMb2dnZWRJbiA9IC0+IHNlbGYuaXNMb2dnZWRJbigpXHJcbiAgICAgICAgICAgIHNjb3BlLmlzTG9hZGluZyA9IC0+IHNlbGYuaXNMb2FkaW5nKClcclxuICAgICAgICAgICAgc2NvcGUudXNlcm5hbWUgPSAtPiBzZWxmLnVzZXIubmFtZVxyXG5cclxuICAgICR3aW5kb3cuX2hhbmRsZUxvZ2luUmVzcG9uc2UgPSAocmVzdWx0KSAtPlxyXG4gICAgICAgICRyb290U2NvcGUuJGFwcGx5IC0+IHNlc3Npb24ucHJvY2Vzc0xvZ2luUmVzdWx0IHJlc3VsdFxyXG4gICAgICAgIFxyXG4gICAgICAgIGRlbGV0ZSBzZXNzaW9uLmxvZ2luV2luZG93XHJcblxyXG4gICAgc2Vzc2lvbi5jaGVja0xvZ2luU3RhdHVzKClcclxuXHJcbiAgICBzZXRJbnRlcnZhbChzZXNzaW9uLmNoZWNrTG9naW5TdGF0dXMuYmluZChzZXNzaW9uKSwgMTAwMCAqIDYwICogNSlcclxuXHJcbiAgICByZXR1cm4gc2Vzc2lvbjtcclxuXSIsImNvZGVmaXN0ID0gYW5ndWxhci5tb2R1bGUgJ2NvZGVmaXN0J1xyXG5cclxuY29kZWZpc3QuZmFjdG9yeSAndXJscycsIFsnJGh0dHAnLCAoJGh0dHApIC0+ICBcclxuICAgIHVzZXJzIDogJy9hcGkvdXNlcnMnXHJcbiAgICB1c2VyIDogKHVzZXJJZCkgLT4gXCIvYXBpL3VzZXJzLyN7dXNlcklkfVwiXHJcbiAgICBcclxuICAgIGdhbWVzIDogJy9hcGkvZ2FtZXMnXHJcbiAgICBnYW1lc0J5VXNlciA6ICh1c2VySWQpIC0+IFwiL2FwaS91c2Vycy8je3VzZXJJZH0vZ2FtZXNcIlxyXG4gICAgZ2FtZSA6IChnYW1lSWQpIC0+IFwiL2FwaS9nYW1lcy8je2dhbWVJZH1cIlxyXG5cclxuICAgIGJvdHNCeUdhbWUgOiAoZ2FtZUlkKSAtPiBcIi9hcGkvZ2FtZXMvI3tnYW1lSWR9L2JvdHNcIlxyXG4gICAgYm90c0J5VXNlciA6ICh1c2VySWQpIC0+IFwiL2FwaS91c2Vycy8je3VzZXJJZH0vYm90c1wiXHJcbiAgICBib3QgOiAoZ2FtZUlkLCBib3RJZCkgLT4gXCIvYXBpL2dhbWVzLyN7Z2FtZUlkfS9ib3RzLyN7Ym90SWR9XCJcclxuXHJcbiAgICBtYXRjaGVzQnlHYW1lIDogKGdhbWVJZCkgLT4gXCIvYXBpL2dhbWVzLyN7Z2FtZUlkfS9tYXRjaGVzXCJcclxuICAgIG1hdGNoZXNCeUJvdCA6IChnYW1lSWQsIGJvdElkKSAtPiBcIi9hcGkvZ2FtZXMvI3tnYW1lSWR9L2JvdHMvI3tib3RJZH0vbWF0Y2hlc1wiXHJcbiAgICBtYXRjaCA6IChtYXRjaElkKSAtPiBcIi9hcGkvbWF0Y2hlcy8je21hdGNoSWR9XCJcclxuICAgXHJcbiAgICBsb2dvdXQ6ICcvc2VjdXJpdHkvbG9nb3V0J1xyXG4gICAgbG9naW46ICcvc2VjdXJpdHkvbG9naW4nXHJcbiAgICBsb2dpblN0YXR1czogJy9zZWN1cml0eS9sb2dpblN0YXR1cydcclxuXVxyXG5cclxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9