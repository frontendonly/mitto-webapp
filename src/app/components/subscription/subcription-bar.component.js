Element({
    selector: 'subscription-bar',
    props: ['userInfo'],
    DI: ['alertService', 'jFlirtDataService'],
    templateUrl: './subscription-bar.html',
    registry: [{
        type: "emitter",
        name: "onValidate"
    }]
}, SubscriptionBarElement);

function SubscriptionBarElement(alertService, jFlirtDataService) {
    this.userInfo = null;
    this.isPremiumUser = false;
    this.isTrial = true;

    this.didInit = function() {
        var paidService = jFlirtDataService.getPaidService(this.userInfo);
        this.isTrial = paidService.isTrial;
        this.isPremiumUser = paidService.isPremiumUser;
        this.onValidate.emit(paidService);
    };

    this.subscription = function() {
        alertService.alertSubscription();
    };
}