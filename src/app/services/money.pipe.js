Service({
    name: 'money',
    DI: ['$money']
}, moneyFilterFn);


function moneyFilterFn($money) {
    this.compile = function(amount, currency) {
        return $money.fx(amount).to(currency);
    };
}