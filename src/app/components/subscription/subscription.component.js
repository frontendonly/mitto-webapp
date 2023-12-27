import {ViewIntentService} from '@jeli/router';
import { CurrencyService } from '../../services/money';
import {MODAL_INSTANCE} from '@jeli/materials';
import { DatabaseService } from '../../services/database.service';

Element({
    selector: 'mitto-subscription',
    DI: [ViewIntentService, CurrencyService, DatabaseService, MODAL_INSTANCE],
    templateUrl: './subscription.html',
    exposeView: true
})
export function MittoScubsriptionElement(viewIntentService, currencyService, databaseService, modalInstance) {
    this.modalInstance = modalInstance;
    this.currencyService = currencyService;
    this.viewIntentService = viewIntentService;
    this.databaseService = databaseService;
    this.modalInstance = modalInstance;
    this.currency = currencyService.getCurrencies();
    this.currencyLoaded = false;
    this.subscriptions = [];
}

MittoScubsriptionElement.prototype.purchase = function(selected) {
    this.modalInstance.close();
    this.viewIntentService.openIntent('checkout', {
        amount: this.currencyService.fx(selected.amount).to(this.currency),
        currency: this.currency,
        duration: selected.duration,
        description: "Mitto subscription for (" + selected.limit + "). "
    });
};

MittoScubsriptionElement.prototype.didInit = function() {
    this.databaseService.core.jQl('select -GET(packages) -configuration')
    .then((res) => {
        this.subscriptions = res.first().packages;
        this.currencyService.load((isLoaded) => {
            this.currencyLoaded = isLoaded;
        });
    });
};