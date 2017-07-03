angular.module('app.services', [])
  .service("fireBaseService", function ($rootScope,$q,$firebaseArray,$ionicLoading) {
    //database ref
    var database = firebase.database();

    this.auth = firebase.auth().onAuthStateChanged(function (user) {
      if (user) {
        $rootScope.$emit('loggedIn', user);
        return true;

      } else {
        console.log("signed out!");
        $rootScope.$emit('loggedOut', {});
        return false;
      }
    });

    //add data to database
    this.addExpenseToDB = function (expense, uid) {
      // alert("inside addExpenseToDB, pushing for uid: " + uid);
      // alert(expense.description);
      $ionicLoading.show({
        content: 'Wait while adding new expense..',
        animation: 'fade-in',
        showBackdrop: true,
        maxWidth: 200,
        showDelay: 0,
        template: '<ion-spinner></ion-spinner> <br/>Wait while adding new expense..'
      });
      //year
      var year = new Date().getFullYear();
      //current month
      var month = new Date().getMonth() +1;
      var keyByDate = month+"_"+year;

      var ref = firebase.database().ref();
      var arrayOfExpenses = $firebaseArray(ref.child('user-expenses').child(uid).child(keyByDate));
      
      return arrayOfExpenses.$add(expense).then(function (ref) {
        console.log(ref);
        $ionicLoading.hide();
        return ref;
      });
    };

    this.addExpenseToDB_OFFLINE = function (callback) {
      var offlineExpenses = JSON.parse(localStorage.getItem("offline_expenses"));
      var uid = firebase.auth().currentUser.uid;
      var updates = {};

      for (var i = 0; i < offlineExpenses.length; i++) {
        var newExpenseKey = firebase.database().ref().child('expenses').push().key;
        var year = new Date().getFullYear();
        var month = new Date().getMonth() + 1;
        var keyByDate = month + "_" + year;
        updates['/user-expenses/' + uid + '/' + keyByDate + '/' + newExpenseKey] = offlineExpenses[i];
      }

      return firebase.database().ref().update(updates, function (error) {
        callback(error);
      });
};

    this.addExpense_OFFLINE_MODE = function(expense){
        var currentOFFLINE_MODE_savedExpenses = JSON.parse(localStorage.getItem('offline_expenses')) || [];
          currentOFFLINE_MODE_savedExpenses.push(expense);
        localStorage.setItem("offline_expenses", JSON.stringify(currentOFFLINE_MODE_savedExpenses));
    };

    //get data from database
    this.getExpensesFromDB = function (uid) {
      var year = new Date().getFullYear();
      //current month
      var month = new Date().getMonth() +1;
      var keyByDate = month+"_"+year;

      var deferred = $q.defer();
      
      firebase.database().ref('user-expenses/' + uid +'/' +keyByDate).on('value', function (snapshot) {
        deferred.resolve(snapshot);
      });

      return deferred.promise;

    };

    //sign up
    this.signUp = function (userEmail, password) {
     return firebase.auth().createUserWithEmailAndPassword(userEmail, password).then(function(user) {
          var sucssObj={
            userObj: user,
            status: true
          };
        return sucssObj;
      }, function(error) {
          // sign up errors
          var errorObj={
            errorObj: error,
            status: false
          };
          return errorObj;
      });
    };

    //sign in
    this.signIn = function (userEmail, password) {
      var signInPromise = firebase.auth().signInWithEmailAndPassword(userEmail, password);
      signInPromise.catch(function (error) {
        // Handle Errors here.
        var errorCode = error.code;
        var errorMessage = error.message;
        console.log(errorMessage);
      });

      return signInPromise;
    };

    this.signOut = function () {
      console.log("signing out..");
      firebase.auth().signOut().then(function () {
        // Sign-out successful.
        console.log("signed out successfuly");
        return true;
      }).catch(function (error) {
        // An error happened.
        console.log("error. unable to sign out");
        console.log(error);
      });
    };
  })
  .service("categoriesService", function ($q) {
    var database = firebase.database();

    this.createDefaultCategories = function(){

      var defCategories = ['Fun (Pubs / Restaurant / Parties)',
                            'Romantic (Date / GF)',
                            'House holdings (Bills / Grocery)',
                            'Car (Gas / Repairs)',
                            'Event (Weddings / Gifts)',
                            'Chlothing',
                            'Tech (Smatphone / PC / Etc..)'];
        var updates = {};

        updates['/user-expenses/' + firebase.auth().currentUser.uid + '/' + 'categories'] = defCategories;
        //create local copy of the default categories
        localStorage.setObj("categories"+firebase.auth().currentUser.uid, defCategories);
        localStorage.setItem(firebase.auth().currentUser.email,firebase.auth().currentUser.uid);

        return firebase.database().ref().update(updates);
    }

      this.getCategoriesFromDB = function(){
        if(firebase.auth().currentUser!==null){
          return firebase.database().ref('user-expenses/' + firebase.auth().currentUser.uid +'/' +'categories').once('value').then(function(snapshot) {
            localStorage.setObj("categories"+firebase.auth().currentUser.uid, snapshot.val());
            return snapshot.val();
          });
        }
      };

      this.getCategoriesFromLocalStorage = function () {
        var deferred = $q.defer();
        firebase.auth().onAuthStateChanged(function (user) {
          if (user) {
            uid = user.uid;
            deferred.resolve(localStorage.getObj("categories" + uid));
          } else {
            // No user is signed in.
            deferred.resolve(false);
          }

          return deferred.promise;
        });
        // if (firebase.auth().currentUser !== null) {
        //   return localStorage.getObj("categories" + firebase.auth().currentUser.uid);
        // }
      };

      this.updateCustomCategories = function(newCategoryArray){
        var updates = {};

        updates['/user-expenses/' + firebase.auth().currentUser.uid + '/' + 'categories'] = newCategoryArray;
        //create local copy of the updated categories
        localStorage.setObj("categories"+firebase.auth().currentUser.uid, newCategoryArray);
        return firebase.database().ref().update(updates);
      };

  })
.service("currencyConversionService", function ($http) {
  var euro = "http://api.fixer.io/latest";
  var dollar = "http://api.fixer.io/latest?base=USD";

  this.shekelToEuro = function(){
      return $http({
        method: 'GET',
        url: euro
      });
  };

  this.shekelToDollar = function(){
      return $http({
        method: 'GET',
        url: dollar
      });
    };

})