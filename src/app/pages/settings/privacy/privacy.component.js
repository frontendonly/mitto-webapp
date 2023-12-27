import { ViewIntentService } from '@jeli/router';
import { FormControlService } from '@jeli/form';
import { GlobalService } from '../../../services/globalservice.factory';
import { DataService } from '../../../services/data.service';

Element({
    selector: 'mitto-settings-privacy',
    DI: [ViewIntentService, GlobalService, DataService],
    templateUrl: './privacy.html',
    exposeView: true
})

export function PrivacySettingsElement(viewIntent, globalservice, dataService) {
    this.isPremiumUser = false;
    this.viewIntent = viewIntent;
    this.globalservice = globalservice;
    this.dataService = dataService;
    this.userInfo = this.viewIntent.getCurrentIntent().params;
    this.isTrial = true;
    this.form = [{
        id: "circles",
        label: "Show my circles"
    }, {
        id: "mobile",
        label: "Show my mobile"
    }, {
        id: "blurimage",
        label: "Blur Image"
    }, {
        id: "available",
        label: "Hide your profile"
    }, {
        id: "addByMittoId",
        label: "Allow others add you by Mitto ID"
    }, {
        id: "addByMobileNumber",
        label: "Allow others add you by Mobile Number"
    }, {
        id: "age",
        label: "Show my age"
    }, {
        id: "location",
        label: "Show my location"
    }, {
        id: "pm",
        label: "Allow Private Message"
    }];

    this.privacyForm = new FormControlService({
        circles: {
            value: this.userInfo.privacy.circles,
            validators: {
                required: true
            }
        },
        mobile: {
            value: this.userInfo.privacy.mobile,
            validators: {
                required: true
            }
        },
        blurimage: {
            value: this.userInfo.privacy.blurimage,
            validators: {
                required: true
            }
        },
        available: {
            value: this.userInfo.privacy.available,
            validators: {
                required: true
            }
        },
        addByMittoId: {
            value: this.userInfo.privacy.addByMittoId,
            validators: {
                required: true
            }
        },
        addByMobileNumber: {
            value: this.userInfo.privacy.addByMobileNumber,
            validators: {
                required: true
            }
        },
        age: {
            value: this.userInfo.privacy.age,
            disabled: true,
            validators: {
                required: true
            }
        },
        location: {
            value: this.userInfo.privacy.location,
            disabled: true,
            validators: {
                required: true
            }
        },
        pm: {
            value: this.userInfo.privacy.pm,
            disabled: true,
            validators: {
                required: true
            }
        }
    });
}

PrivacySettingsElement.prototype.didInit = function () {
}

PrivacySettingsElement.prototype.subscriptionCheck = function (event) {
    this.isTrial = event.isTrial;
    this.isPremiumUser = event.isPremiumUser;
    ['age', 'location', 'pm'].forEach(key => {
        var field = this.privacyForm.getField(key);
        if (this.isPremiumUser){
            field.enable()
        } else {
            field.disable()
        }
    });
};

PrivacySettingsElement.prototype.updateSettings = function () {
    if (!this.privacyForm.touched) return;
    Object.assign(this.userInfo.privacy, this.privacyForm.value);
    this.dataService.updateProfile({
        privacy: this.userInfo.privacy,
        uid: this.userInfo.uid
    }).then(() => {
        this.globalservice.events.dispatch('settings.privacy', this.privacyForm.value);
    });
}