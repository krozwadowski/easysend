angular
    .module('MyApp', ['ngMaterial'])
    .controller('EasySendCtrl', function($scope, $element, $http) {
        $scope.searchTerm;
        $scope.sfaState = true;
        $scope.countries_in = null;
        $scope.countries_out = null;
        $scope.currencies_in = null;
        $scope.currencies_out = null;
        $scope.MoneyToSend = null;
        $scope.MoneyToRecive = null;
        
            //załadowanie listy krajów
            $http({
                url: 'https://www.easysend.pl/api/calculator/countries',
                method: "GET"
            }).then(function successCallback(response) {
                console.log(response);
                $scope.countries_in = response.data;
                //ustawienie UK jako domyślnego kraju wysyłki
                $scope.selectedCountriesIn = 2;
                //ustawienie pozostałych inicjalnych parametrów
                $scope.initMode();
            }, function errorCallback(response) {
               alert('Wystąpił błąd - IniError:' +response);
            });


        //czyszcznie szukacza w liście rozwijanej
        $scope.clearSearchTerm = function() {
            $scope.searchTerm = '';
        };
        $element.find('input').on('keydown', function(ev) {
            ev.stopPropagation();
        });

        //funkcja odpowiedzialna za listowanie krajów docelowej destynacji
        $scope.getCountryOut = function(start){
            $scope.countries_out = null;
            $http({
                    url: 'https://www.easysend.pl/api/calculator/countries/'+$scope.selectedCountriesIn+'/destinations',
                    method: "GET"
                }).then(function successCallback(response) {
                    console.log(response);
                        $scope.countries_out = response.data;
                        if (start === 0){
                            //wywołanie funkcji pobierania walut w trybie (0 - w toku, 1- inicjalnie)
                            $scope.getCurencyIn(0);
                        }
                }, function errorCallback(response) {
                alert('Wystąpił błąd - getCountryOut:' +response)

            });
        };

        //funkcja odpowiedzialna za pobranie walut 
        $scope.getCurencyIn = function (start) {
            if (start === 0) {
                //funkcja w toku, czyszczenie pól związanych z walutami, kwotami i kursem

                $scope.currencies_in = '';
                $scope.currencies_out = '';
                $scope.selectedCICurrency = '';
                $scope.selectedCOCurrency = '';
                $scope.MoneyToSend = '';
                $scope.rateCI ='';
                $scope.rateCO ='';
                $scope.MoneyToRecive = '';
                $scope.sfaState = true;
                $scope.rate = '';
            }

            $http({
                url: 'https://www.easysend.pl/api/calculator/currencies/'+$scope.selectedCountriesIn+'/'+$scope.selectedCountriesOut,
                method: "GET"
            }).then(function successCallback(response) {
                console.log(response.data);
                //1-element ma jedną walutę
                var uniqueNames = [];
                var uniqueObj = [];
                //wybranie unikalnych nazw waluty dla currency_in z par pobranych powyższym żądaniem
                for(i = 0; i< response.data.length; i++){
                    if(uniqueNames.indexOf(response.data[i].currency_in.id) === -1){
                        uniqueObj.push(response.data[i])
                        uniqueNames.push(response.data[i].currency_in.id);
                    }
                }
                
                $scope.currencies_in = uniqueObj;
                if (start === 0) {
                    //wskazanie pierwszych opcji wyboru dla walut celem bardziej eleganckiego wyglądy
                  $scope.selectedCICurrency = response.data[0].currency_in.name;
                  $scope.selectedCOCurrency = response.data[0].currency_out.name;
                }
                $scope.currencies_out = response.data;

            }, function errorCallback(response) {
                alert('Wystąpił błąd - getCurencyIn:' +response)
            });

        };
        
        //funkcja odpowiedzialna za dostępność opcji przelewu superfast. Jej stan zmienia się w zależności od wyboru currency_out
        $scope.setSFA = function (state) {
            if (state === true) {
                $scope.sfaState = false;
            }
            else{
                $scope.sfaState = true;

            }
        };
        
        //dokonanie obliczeń i nadanie odpowiedniego wyglądu kwotom. 
        // Direction=1 oznacza obliczenia z kwoty do wysłania*kurs
        $scope.calculate = function (direction) {
                if (direction === 1) {
                    if ($scope.MoneyToSend != '') {
                        var amount = parseFloat($scope.MoneyToSend.replace(',', '.')).toFixed(2).replace('.', ',');
                        $scope.getExchangeRate(direction, $scope.MoneyToSend.replace(',', '.'));
                        $scope.MoneyToSend = amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")
                    }
                }
                else {
                    if ($scope.MoneyToRecive != '') {
                        var amount = parseFloat($scope.MoneyToRecive.replace(',', '.')).toFixed(2).replace('.', ',');
                        $scope.getExchangeRate(direction, $scope.MoneyToRecive.replace(',', '.'));
                        $scope.MoneyToRecive = amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")
                    }
                }


        }

        //pobieranie kursu 
        $scope.getExchangeRate = function (direction, amount) {
            $http({
                url: 'https://www.easysend.pl/api/calculator/exchange-rate/'+$scope.selectedCICurrency+'/'+$scope.selectedCOCurrency+'/'+amount,
                method: "GET"
            }).then(function successCallback(response) {
                console.log(response);
                $scope.rate = (response.data.rate).toFixed(2).replace('.',',');

                if (response.data.is_inverse  ===  true){
                    $scope.rateCO = $scope.selectedCICurrency;
                    $scope.rateCI = $scope.selectedCOCurrency;
                }
                else{
                    $scope.rateCI = $scope.selectedCICurrency;
                    $scope.rateCO = $scope.selectedCOCurrency;
                }
                console.log(response.data.is_inverse);
                $scope.exchangeAmount(direction, amount, response.data.is_inverse,response.data.rate);

            }, function errorCallback(response) {
                alert('Wystąpił błąd - getExchangeRate:' +response)

            });
        }
        //dokonanie końcowych obliczeń wraz z weryfikacją sposobu obliczania (parametr inverse)
        $scope.exchangeAmount = function (direction, amount, inverse,rate) {
            if (direction === 1) {
                if (inverse === false){
                    var exch = (amount * rate).toFixed(2).replace('.',',');
                    $scope.MoneyToRecive = exch.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");

                }
                else{
                    var exch = (amount * (1/rate)).toFixed(2).replace('.',',');
                    $scope.MoneyToRecive = exch.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
                }

            }
            else{
                if (inverse === false){
                    var exch = (amount * (1/rate)).toFixed(2).replace('.',',');
                    $scope.MoneyToSend = exch.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");

                }
                else{
                    var exch = (amount * rate).toFixed(2).replace('.',',');
                    $scope.MoneyToSend = exch.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");

                }
            }
            }
        //stan inincjalny
        $scope.initMode = function () {
            $scope.getCountryOut(1)
            $scope.selectedCountriesOut = 1;
            $scope.getCurencyIn(1);
            $scope.selectedCICurrency = 'GBP';
            $scope.selectedCOCurrency = 'PLN';
            $scope.MoneyToSend = '100';
            $scope.calculate(1);

        }
    })
    //blokowanie wprowadzenia innych znaków niż cyfry i przecinek.
.directive('validNumber', function() {
    return {
        require: '?ngModel',
        link: function(scope, element, attrs, ngModelCtrl) {
            if(!ngModelCtrl) {
                return;
            }

            ngModelCtrl.$parsers.push(function(val) {
                if (angular.isUndefined(val)) {
                    var val = '';
                }

                var clean = val.replace(/[^0-9,]/g, '');

                var decimalCheck = clean.split(',');
         

                if(!angular.isUndefined(decimalCheck[1])) {
                    decimalCheck[1] = decimalCheck[1].slice(0,2);
                    clean =decimalCheck[0] + ',' + decimalCheck[1];
                }

                if (val !== clean) {
                    ngModelCtrl.$setViewValue(clean);
                    ngModelCtrl.$render();
                }
                return clean;
            });

            element.bind('keypress', function(event) {
                if(event.keyCode === 32) {
                    event.preventDefault();
                }
            });
        }
    };
});