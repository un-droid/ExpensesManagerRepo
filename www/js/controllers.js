angular.module('app.controllers', ['app.services'])

  .controller('SettingsCtrl', function ($scope, categoriesService) {
    $scope.customCategoriesForm = {};
    $scope.ExistingCategoriesArray = [];
    $scope.addNewCategory = {value : ""};
    $scope.$on('$ionicView.beforeEnter', function () {

      firebase.auth().onAuthStateChanged(function (user) {
        if (user) {
          uid = user.uid;
          if (localStorage.getObj("categories" + uid)) {
            $scope.ExistingCategoriesArray = localStorage.getObj("categories" + uid);
          } else {
            categoriesService.getCategoriesFromDB().then(function (res) {
              $scope.ExistingCategoriesArray = res;
            });
          }
        } else {
          // No user is signed in.
          $state.go('eventmenu.auth');
        }
      });
    });

    $scope.removeCategory = function (removeExistingCategory) {
      if ($scope.ExistingCategoriesArray.length > 1) {
        $scope.ExistingCategoriesArray.splice($scope.ExistingCategoriesArray.indexOf(removeExistingCategory), 1);
        categoriesService.updateCustomCategories($scope.ExistingCategoriesArray);
        if ($scope.ExistingCategoriesArray.length === 1) {
          $scope.disableRemoveButton = true;
        }
      } 
    }

    $scope.addCategory = function (newCategory) {
      $scope.ExistingCategoriesArray.push(newCategory);
      categoriesService.updateCustomCategories($scope.ExistingCategoriesArray);
       $scope.addNewCategory.value = "";
      if ($scope.ExistingCategoriesArray.length > 1) {
        $scope.disableRemoveButton = false;
      }
    }
  })

  .controller('ExpenseCtrl', function ($scope, $ionicPopup, fireBaseService, categoriesService, $firebaseObject, $firebaseArray,$state) {

    var uid;
    firebase.auth().onAuthStateChanged(function(user) {
      if (user) {
        uid = user.uid;
      } else {
        // No user is signed in.
      }
    });

    $scope.$on('$ionicView.beforeEnter', function () {

      firebase.auth().onAuthStateChanged(function (user) {
        if (user) {
          uid = user.uid;
          if (localStorage.getObj("categories" + uid)) {
            $scope.expenseCategory = localStorage.getObj("categories" + uid);
          } else {
            categoriesService.getCategoriesFromDB().then(function (res) {
              $scope.ExistingCategoriesArray = res;
            });
          }
        } else {
          // No user is signed in.
          $state.go('eventmenu.auth');
        }
      });

    });

    $scope.expensePayingMethod = [
      {
        value: "Cash"
      },
      {
        value: "Check"
      },
      {
        value: "Credit card"
      }
    ];

    $scope.expenseCurrency = [{
        value: "₪"
      },
      {
        value: "$"
      },
      {
        value: "€"
      },
      {
        value: "..."
      }
    ];

    $scope.newExpenseObject = {
      necessary: false
    };
    $scope.addExpense = function () {

      $scope.data = {}

      $ionicPopup.show({
        title: 'Expense will be added',
        subTitle: 'Are you sure?',
        scope: $scope,
        buttons: [{
          text: 'Cancel',
          onTap: function (e) {
            return false;
          }
        }, {
          text: '<b>Save</b>',
          type: 'button-positive',
          onTap: function (e) {
            return true;
          }
        }, ]
      }).then(function (res) {

        if (res) {
          
          var today = new Date();
          var user = firebase.auth().currentUser;
          var date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
          var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
          var dateTime = date + ' ' + time;
          $scope.newExpenseObject.purchaseTime = dateTime;
          $scope.newExpenseObject.purchaseTimeStamp = new Date().getTime();

          if($scope.newExpenseObject.currency == "$"){
            $scope.newExpenseObject.priceShekel =  parseFloat(($scope.newExpenseObject.price * parseFloat(localStorage.getItem('shekelDollar'))).toFixed(2));
          }else if($scope.newExpenseObject.currency == "€"){
            $scope.newExpenseObject.priceShekel =  parseFloat(($scope.newExpenseObject.price * parseFloat(localStorage.getItem('shekelEuro'))).toFixed(2));
          }

          //******************connection checking for offline storage and online syncing****************
          if(window.Connection){
            if(navigator.connection.type == Connection.NONE){
              alert("You're offilne. Will try to operate locally.");
              fireBaseService.addExpense_OFFLINE_MODE($scope.newExpenseObject);
            }else{
              //connection present - add data as usual
              fireBaseService.addExpenseToDB($scope.newExpenseObject, user.uid).then(function (res) {
                console.log(res);
              },
                function (err) {
                  console.log("The expected Firebase action failed to occur this was your error: " + err);
                });
            }
          }else{
            //connection present - add data as usual - this will work in a browser
            fireBaseService.addExpenseToDB($scope.newExpenseObject, user.uid).then(function (res) {
              console.log(res);
            },
              function (err) {
                console.log("The expected Firebase action failed to occur this was your error: " + err);
              });
          }

          for (var member in $scope.newExpenseObject) {
            delete $scope.newExpenseObject[member];
          }
        }
      }, function (err) {
        console.log('Err:', err);
      }, function (msg) {
        console.log('message:', msg);
      });

    };


  })

  .controller('GraphCtrl', function ($scope, fireBaseService) {
    function createChartData(expensesObj) {
      var arr = [];
      for (prop in expensesObj) {
        if (prop != "total") {
          var tmp = {
            name: prop,
            y: expensesObj[prop]
          };
          arr.push(tmp);
        }
      }
      console.log(arr);
      return arr;
    }

      function drawChart(expensesObj) {
        $scope.totalExpenses = expensesObj.total;
        $scope.chartConfig = {
          options: {
            chart: {
              type: 'pie',
              plotBackgroundColor: null,
              plotBorderWidth: null,
              plotShadow: false

            },
            title: {
              text: 'Monthly expenses: '+expensesObj.total+" ₪"
            },
            plotOptions: {
              pie: {
                size:'100%',
                dataLabels: {
                  enabled: true,
                     style: {
                    textShadow: false 
                },
               distance: -60,
               format: "{point.name}<br>{point.y}",
                    distance: -60,
                },
                showInLegend: true
              }
            }
          },
          series: [{
            data: createChartData(expensesObj)
          }],

          loading: false
        }
      }

      $scope.$on('$ionicView.enter', function ($scope) {
        var userId;

        firebase.auth().onAuthStateChanged(function (user) {
          if (user) {
            userId = user.uid;
            console.log("got user uid: "+userId);

            fireBaseService.getExpensesFromDB(userId).then(function (snapshot) {
              var expensesObj = {};
              snapshot.forEach(function (child) {
                //var key = child.key;
                var value = child.val();
                expensesObj[value.category] = (expensesObj[value.category] || 0) + (value.priceShekel || value.price);
                expensesObj.total = (expensesObj.total || 0) + (value.priceShekel || value.price);
              });
              console.log(expensesObj);
              drawChart(expensesObj);
            });
          } else {
            console.log("user not signed in!");
          }
        });
      }); //end of before enter


  })
  .controller('MenuCtrl', function ($scope, fireBaseService, $rootScope) {

    $scope.menuTitle = "Sign in for your expenses";
    $scope.showLogOut = false;
    $rootScope.$on('loggedIn', function (event, data) {
      $scope.menuTitle = data.email;
      $scope.showLogOut = true;
    });

    $rootScope.$on('loggedOut', function (event, data) {
      $scope.menuTitle = "Sign in for your expenses";
      $rootScope.$apply(function () {
        $scope.menuTitle = "Sign in for your expenses";
        $scope.showLogOut = false;
      });
    });
    $scope.signOut = function () {
      console.log("sign out clicked");
      fireBaseService.signOut();
    }
  })
  .controller('AuthCtrl', function ($scope, fireBaseService, $state, $ionicHistory, categoriesService,$ionicLoading,$timeout) {
    // upon login, redirect to new expanse page
    $scope.signUpObject = {};
    $scope.signInObject = {};
    $scope.showSignUp = false;
    $scope.showSignInError = false;
    $scope.signTitle = "Sign In";

    $scope.signUp = function () {
        $ionicLoading.show({
          content: 'Wait!',
          animation: 'fade-in',
          showBackdrop: true,
          maxWidth: 200,
          showDelay: 0,
          template: '<ion-spinner></ion-spinner> <br/>Signing up, please wait..'
        });

      fireBaseService.signUp($scope.signUpObject.email, $scope.signUpObject.password).then(function (registrationConfirmation) {
        if (registrationConfirmation.status) {
          $ionicHistory.nextViewOptions({
            disableBack: true
          });
          //create default categories
          console.log(registrationConfirmation);
          categoriesService.createDefaultCategories(firebase.auth().currentUser.uid);
          $ionicLoading.hide();
          $state.go('eventmenu.expense');
        } else {
          console.log("registration failed");
          $ionicLoading.hide();
          // sign up errors
          //var errorCode = error.code;
          var errorMessage = registrationConfirmation.errorObj.message;
          console.log(errorMessage);
          $scope.errorMessage ="Registration failed. "+ errorMessage;
          $scope.showSignInError = true;
          $timeout(function(){
            $scope.showSignInError = false;
          },4000)
        }
      });
    }

    $scope.signIn = function () {
        $ionicLoading.show({
          content: 'Wait!',
          animation: 'fade-in',
          showBackdrop: true,
          maxWidth: 200,
          showDelay: 0,
          template: '<ion-spinner></ion-spinner> <br/>Signing in, please wait..'
        });
      fireBaseService.signIn($scope.signInObject.email, $scope.signInObject.password).then(function (user) {
        $ionicLoading.hide();
        $ionicHistory.nextViewOptions({disableBack: true});
        $state.go('eventmenu.expense');
      },function(err){
        $ionicLoading.hide();
        console.log(err);
         $scope.errorMessage = err.code;
        $scope.showSignInError = true;
        $timeout(function(){
          $scope.showSignInError = false;
        },4000)
      });
    }

    $scope.foo = function (bool) {
      if (bool) {
        $scope.signTitle = "Sign Up";
      } else {
        $scope.signTitle = "Sign In";
      }
    }

  });
