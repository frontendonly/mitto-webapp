import { AlertService } from "../../../services/alert.service";
import { CoinsDataService } from "../../../services/coins.data.service";

Element({
    selector: 'mitto-settings-change-pin',
    DI: [
        AlertService,
        CoinsDataService,
        'changeDetector?'
    ],
    templateUrl: './change-pin.html',
    exposeView: true
})
export function ChangePinElement(alertService, coinsDataService, changeDetector) {
    this.alertService = alertService;
    this.coinsDataService = coinsDataService;
    this.changeDetector = changeDetector;
    this.hasPin = false;
    this.pinForm = {};
}

ChangePinElement.prototype.didInit = function() {
    this.coinsDataService
        .getCoinsInfo()
        .then(res => {
            this.hasPin = res.jDBNumRows();
            this.changeDetector.onlySelf();
        });
}

ChangePinElement.prototype.changePin = function() {
    //set the UID
    this.pinForm.uid = this.userInfo.uid;
    this.coinsDataService.changePin(this.pinForm, false)
    .then(() =>  this.alertService.alert("Pin Successfully Changed!!", 3000), err => this.alertService.alert(err.message));
};