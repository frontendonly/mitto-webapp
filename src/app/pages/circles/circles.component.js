import { ViewIntentService } from '@jeli/router';
import { AlertService } from '../../services/alert.service';
import { CircleService } from './circle.service';

Element({
    selector: 'mitto-circles',
    DI: [ViewIntentService, AlertService, CircleService,'changeDetector?'],
    templateUrl: './circles.html',
    styleUrl: './circle.css',
    exposeView: true
})
export function CirclesElement(viewIntentService, alertService, circleService, changeDetector) {
    this.circleData = [];
    this.changeDetector = changeDetector;
    this.viewIntentService = viewIntentService;
    this.alertService = alertService;
    this.circleService = circleService;
    this.userInfo = {};
    this._currentActivity = {};

    Object.defineProperty(this, 'canViewInfo', {
        get: () => {
            return (this.isMatchView || (this.subscriberInfo && this.subscriberInfo.isPremiumUser));
        }
    })
}

CirclesElement.prototype.performQuery = function () {
    this.circleService.performQuery(this._currentActivity.name, this._currentActivity.data.tables, this.userInfo.uid)
        .then((res) => {
            this.circleData = res.getResult();
            this.changeDetector.detectChanges();
        });
}

CirclesElement.prototype.open = function (userInfo) {
    if (this.canViewInfo) {
        this.viewIntentService.openIntent('profile', userInfo);
    } else {
        this.alertService.alertSubscription();
    }
}

CirclesElement.prototype.didInit = function () {
    this._currentActivity = this.viewIntentService.getCurrentIntent();
    this.labels = this._currentActivity.data.labels;
    var canShowViews = [this.labels.title.toLowerCase()];
    this.circleService.getCurrentUserInfo()
        .then((userInfo) => {
            this.userInfo = userInfo;
            this.performQuery();
            this.isMatchView = canShowViews.includes('match');
            this.isFavorites = canShowViews.includes('favorites');
        });
};

CirclesElement.prototype.subscriptionCheck = function (event) {
    this.subscriberInfo = event.value;
};