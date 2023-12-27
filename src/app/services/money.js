import { DatabaseService } from './database.service';
import { geoServiceControl } from './utils';

Service({
    name: 'CurrencyService',
    DI: [DatabaseService]
})
export function CurrencyService(databaseService) {
    this.data = null;
    this.base = 'USD';
    this.databaseService = databaseService;
    this.allCurrencies = require('../../cms/currency.json');

    Object.defineProperty(this, 'canLoadNewData', {
        get: () => (!this.data || Date.now() > this.data.next_occurence)
    });
}

/**
     * load Data
     */
CurrencyService.prototype.load = function(cb) {
    if (this.canLoadNewData) {
        this.databaseService.core.api("/currency/exchange", { base: this.base })
            .then(data => {
                if (data.result.success) {
                    this.data = data.result;
                }
                cb(data.result.success);
            }, function() {
                cb(false);
            });
    }

    cb(true);
}

CurrencyService.prototype.getRates = function() {
    return this.data.rates || {};
};

CurrencyService.prototype.currencyExists = function(cur) {
    return this.data.rates.hasOwnProperty(cur) ? cur : this.base;
};

CurrencyService.prototype.fx = function(amount) {
    return {
        to: cur => {
            if (!this.data || !this.data.rates.hasOwnProperty(cur)) {
                return amount;
            }

            return Math.ceil(this.data.rates[cur] * amount);
        }
    }
};

CurrencyService.prototype.getCurrencies = function() {
    return this.allCurrencies[geoServiceControl.country && geoServiceControl.country.short_name] || this.base;
}