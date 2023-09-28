Service({
    name: '$money',
    DI: ['$http', 'jDB', 'jFlirtDataService', 'dateTimeFactory', 'GlobalService']
}, moneyFN);
/**
 * 
 * @param {*} $http 
 * @param {*} jdb 
 * @param {*} jFlirtDataService 
 * @param {*} dateTimeFactory 
 * @param {*} _ 
 */
function moneyFN($http, jdb, jFlirtDataService, dateTimeFactory, _) {
    var _data_,
        base = 'USD';
    this.allCurrencies = require('../../cms/currency.json');
    /**
     * load Data
     */
    this.load = function(cb) {
        if (!_data_ || (_data_ && dateTimeFactory.$timeConverter(_data_.lastLoaded).days)) {
            return jdb.tx.api("/currency/exchange", {
                    base: base
                })
                .then(function(data) {
                    if (data.result.success) {
                        _data_ = data.result;
                        cb(true);
                    }
                }, function() {
                    cb(false);
                });
        }

        cb(true);
    }

    this.getRates = function() {
        return _data_.rates || {};
    };

    this.currencyExists = function(cur) {
        return _data_.rates.hasOwnProperty(cur) ? cur : base;
    };

    this.fx = function(amount) {
        return {
            to: function(cur) {
                if (!_data_ || !_data_.rates.hasOwnProperty(cur)) {
                    return amount;
                }

                return Math.ceil(_data_.rates[cur] * amount);
            }
        }
    };

    this.getCurrencies = function() {
        return this.allCurrencies[_.geoServiceControl.country && _.geoServiceControl.country.short_name] || base;
    };
}