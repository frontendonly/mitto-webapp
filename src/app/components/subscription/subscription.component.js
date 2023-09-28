Element({
    selector: 'mitto-subscription',
    props: ['closeModal'],
    DI: ['viewIntent', '$money', 'jDB', 'ElementRef'],
    templateUrl: './subscription.html'
}, MittoScubsriptionComponent);

function MittoScubsriptionComponent(viewIntent, $money, jdb, elementRef) {
    this.currency = $money.getCurrencies();
    this.currencyLoaded = false;
    this.subscriptions = [];

    this.purchase = function(selected) {
        this.closeModal();
        viewIntent.openIntent('checkout', {
            amount: $money.fx(selected.amount).to(this.currency),
            currency: this.currency,
            duration: selected.duration,
            description: "Mitto subscription for (" + selected.limit + "). "
        });
    };

    this.didInit = function() {
        var _this = this;
        jdb.tx.jQl('select -GET(packages) -configuration', {
            onSuccess: function(res) {
                _this.subscriptions = res.first().packages;
                $money.load(function(isLoaded) {
                    _this.currencyLoaded = isLoaded;
                });
            }
        });
    };
}