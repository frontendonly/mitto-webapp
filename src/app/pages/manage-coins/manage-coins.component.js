import { AlertService } from "../../services/alert.service";
import { ViewIntentService } from '@jeli/router';
import { CoinsDataService } from "../../services/coins.data.service";
import { CurrencyService } from "../../services/money";
import { RealTimeService } from "../../services/notification.factory";

Element({
    selector: 'mitto-manage-coins',
    DI: [ViewIntentService, AlertService, CoinsDataService, RealTimeService, CurrencyService, 'changeDetector?'],
    templateUrl: './manage-coins.html',
    exposeView: true
})
export function ManageCoinsElement(viewIntent, alertService, coinsDataService, realTimeService, currencyService, changeDetector) {
    this.accordionItems = ['history','transfer', 'buy'];
    this.realTimeService = realTimeService;
    this.viewIntent = viewIntent;
    this.alertService = alertService;
    this.coinsDataService = coinsDataService;
    this.currencyService = currencyService;
    this.changeDetector = changeDetector;
    /**
     * default selected coins purchase
     */
    this.selected = 2;
    this.userInfo = {};
    this.hasPin = false;
    this.totalCoins = 0;
    this.historys = [];
    this.selectedAccordionItem = 'history';
    this.currency = currencyService.getCurrencies();
    this.pinForm = {};
    this.transfer = {
        error: null,
        form: {
            amount:0,
            receiver: null,
            pin: ''
        }
    };

    Object.defineProperty(this, 'canTransfer', {
        get: () => (this.transfer.form.pin.length >= 4 && (this.transfer.form.amount  && this.transfer.form.amount) <= this.totalCoins && this.transfer.form.receiver)
    })
}

//load all history
ManageCoinsElement.prototype.loadHistory = function () {
    this.coinsDataService
        .getCoinsHistory(this.userInfo.uid)
        .then((res) => {
            this.historys = res.getResult();
            this.changeDetector.detectChanges();
        });
};

ManageCoinsElement.prototype.setKlass = function (isDebit) {
    return (isDebit) ? 'active' : '';
};



ManageCoinsElement.prototype.purchase = function (coin, idx) {
    this.viewIntent.openIntent('checkout', {
        amount: this.currencyService.fx(coin.amount).to(this.currency),
        currency: this.currency,
        description: "Mitto coins purchase (" + coin.value + " units)"
    });

    this.selected = idx;
};

ManageCoinsElement.prototype.changePin = function () {
    if (!this.pinForm.newPin || this.pinForm.newPin !== this.pinForm.verifyPin) return;
    //set the UID
    this.pinForm.uid = this.userInfo.uid;
    this.coinsDataService.changePin(this.pinForm, !this.hasPin)
    .then(() => {
        if (!this.hasPin) {
            this.hasPin = true;
            this.totalCoins = 100;
        } else {
            this.setAccordion('resetPin');
            this.alertService.alert("Pin Successfully Changed!!");
        }
    }, (err) => this.alertService.alert(err.message));
};

ManageCoinsElement.prototype.selectUser = function (user) {
    if (!user) {
        this.circleList = [];
        return;
    }

    this.coinsDataService
        .selectUser(user, this.userInfo.uid)
        .then((res) => {
            this.circleList = res.getResult();
            this.changeDetector.detectChanges();
        });
}

ManageCoinsElement.prototype.onTagSelected = function(event) {
    var user = event[0] || {};
    this.transfer.form.user = user.name || null;
    this.transfer.form.receiver = user.uid || null;
    this.circleList = [];
}

ManageCoinsElement.prototype.submitTransferRequest = function () {
    if (!this.canTransfer) return;
    this.transfer.error = null;
    this.transfer.inProgress = true;
    this.coinsDataService.transferCoins(this.transfer.form)
        .then(() => {
            this.totalCoins = this.totalCoins - this.transfer.form.amount;
            this.transfer.form = {
                amount:0,
                receiver: null,
                pin: ''
            };
            this.transfer.inProgress = false;
            this.selectedAccordionItem = 'history';
            this.loadHistory();
        }, (err) => {
            console.log(err)
            this.transfer.inProgress = false;
            this.transfer.error = err.message;
            this.changeDetector.detectChanges();
        });
};

ManageCoinsElement.prototype.validator = function (field) {
    var actions = {
        amount: () => {
            if (this.transfer.form.amount > this.totalCoins) {
                this.transfer.error = "You need " + (this.transfer.form.amount - this.totalCoins) + "MTC, please buy more coins";
            } else {
               this.transfer.error = null;
            }
        },
        pin: function () { }
    };

    (actions[field])();
}

ManageCoinsElement.prototype.viewDidDestroy = function () {
    this.realTimeService.events.unregister("events.coins.history");
};

ManageCoinsElement.prototype.didInit = function () {
    // load user info
    this.coinsDataService.dataService.getCurrentUserInfo()
        .then((data) => {
            this.userInfo = data;
            this.transfer.form.sender = data.uid;
            //init process
            this.loadHistory();
        });

    // get coins info
    this.coinsDataService
        .getCoinsInfo()
        .then((res) => {
            this.hasPin = res.jDBNumRows();
            if (this.hasPin) {
                this.totalCoins = res.first().total;
            } else {
                this.selectedAccordionItem = 'resetPin';
            }
        });

    this.coinsDataService
        .purchases()
        .then(res => this.coinsPurchase = res.first().coinsPurchase);

    this.realTimeService.events.register("events.coins.history", (res, getCount) => {
        if (getCount('coins_history')) {
            this.loadHistory();
        };
    });
}