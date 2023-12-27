import { AlertService } from "../../services/alert.service";
import { DataService } from "../../services/data.service";
import { EventEmitter } from '@jeli/core';

Element({
    selector: 'subscription-bar',
    props: ['userInfo'],
    DI: [AlertService, DataService],
    templateUrl: './subscription-bar.html',
    events: ['onValidate:emitter']
})
export function SubscriptionBarElement(alertService, dataService) {
    this.userInfo = null;
    this.isPremiumUser = false;
    this.isTrial = true;
    this.onValidate = new EventEmitter();

    this.didInit = function() {
        var paidService = dataService.getPaidService(this.userInfo);
        this.isTrial = paidService.isTrial;
        this.isPremiumUser = paidService.isPremiumUser;
        this.onValidate.emit(paidService);
    };

    this.subscription = function() {
        alertService.alertSubscription();
    };
}