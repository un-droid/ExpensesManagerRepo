angular.module('app', ['ionic', 'app.controllers', 'app.services', 'highcharts-ng', 'firebase'])

  .config(function ($stateProvider, $urlRouterProvider) {

    $stateProvider
      .state('eventmenu', {
        url: "/event",
        abstract: true,
        templateUrl: "templates/menu.html",
        controller: "MenuCtrl"
      })

      .state('eventmenu.expense', {
        url: "/expense",
        views: {
          'menuContent': {
            templateUrl: "templates/expense.html",
            controller: "ExpenseCtrl"
          }
        }
      })
      .state('eventmenu.auth', {
        url: "/auth",
        views: {
          'menuContent': {
            templateUrl: "templates/auth.html",
            controller: "AuthCtrl"
          }
        }
      })
      .state('eventmenu.graph', {
        url: "/graph",
        views: {
          'menuContent': {
            templateUrl: "templates/graph.html",
            controller: "GraphCtrl"
          }
        }
      })
      .state('eventmenu.settings', {
        url: "/settings",
        views: {
          'menuContent': {
            templateUrl: "templates/settings.html",
            controller: "SettingsCtrl"
          }
        }
      })

    $urlRouterProvider.otherwise("/event/expense");
  })

  .run(function ($ionicPlatform, currencyConversionService, fireBaseService, $ionicLoading) {
    $ionicPlatform.ready(function () {
      if (window.cordova && window.cordova.plugins.Keyboard) {
        // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
        // for form inputs)
        cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);

        // Don't remove this line unless you know what you are doing. It stops the viewport
        // from snapping when text inputs are focused. Ionic handles this internally for
        // a much nicer keyboard experience.
        cordova.plugins.Keyboard.disableScroll(true);
      }
      if (window.StatusBar) {
        StatusBar.styleDefault();
      }

      //local storage extension to set and get objects and arrays
      Storage.prototype.setObj = function (key, obj) {
        return this.setItem(key, JSON.stringify(obj))
      };
      Storage.prototype.getObj = function (key) {
        return JSON.parse(this.getItem(key))
      };

      //get latest euro and dollar value againts the shekel and save it to local storage too
      currencyConversionService.shekelToEuro().then(function (res) {
        //console.log(res.data.rates.ILS);
        localStorage.setItem('shekelEuro', res.data.rates.ILS)
      });

      currencyConversionService.shekelToDollar().then(function (res) {
        //console.log(res.data.rates.ILS);
        localStorage.setItem('shekelDollar', res.data.rates.ILS);
      });
    });

    document.addEventListener("online", onOnline, false);

    var callshit = function (error) {
      if (error) {
        console.log("error saving! to db");
        $ionicLoading.hide();
        alert("Something went wrong. Unable to sync data");
        
      } else {
        console.log("saved good, clearing localStorage");
        $ionicLoading.hide();
        alert("Data synced. Happy spending!");
        localStorage.removeItem('offline_expenses');
      }
    }

    function onOnline() {
      var currentOFFLINE_MODE_savedExpenses = JSON.parse(localStorage.getItem('offline_expenses')) || [];
      if (currentOFFLINE_MODE_savedExpenses.length > 0) {
        alert("Hang on, syncing offline expenses!. entering sync offline service");
        fireBaseService.addExpenseToDB_OFFLINE(callshit);
        $ionicLoading.show({
          content: 'Wait!',
          animation: 'fade-in',
          showBackdrop: true,
          maxWidth: 200,
          showDelay: 0,
          template: '<ion-spinner></ion-spinner> <br/>Wait while syncing offline data..'
        });
      }
    };

    document.addEventListener("offline", onOffline, false);

    function onOffline() {
      alert("Phone lost connection!");
    };
  })