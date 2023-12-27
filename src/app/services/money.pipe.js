import { CurrencyService } from "./money";

Service({
    name: 'money',
    DI: [CurrencyService]
})
export function MoneyFilterService(currencyService) {
    this.compile = function(amount, currency) {
        return currencyService.fx(amount).to(currency);
    };
}