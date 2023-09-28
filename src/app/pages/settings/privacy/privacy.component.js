Element({
    selector: 'mitto-settings-privacy',
    DI: ['viewIntent', "GlobalService", "jFlirtDataService", 'formControlService'],
    templateUrl: './privacy.html'
}, PrivacySettingsComponent);

function PrivacySettingsComponent(viewIntent, _, jFlirtDataService, formControlService) {
    this.isPremiumUser = false;
    this.isTrial = true;
    this.form = [{
        id: "circles",
        validators: {
            required: true
        },
        label: "Show my circles"
    }, {
        id: "mobile",
        validators: {
            required: true
        },
        label: "Show my mobile"
    }, {
        id: "blurimage",
        validators: {
            required: true
        },
        label: "Blur Image"
    }, {
        id: "available",
        validators: {
            required: true
        },
        label: "Visiblity"
    }, {
        id: "addByMittoId",
        validators: {
            required: true
        },
        label: "Allow others add you by Mitto ID"
    }, {
        id: "addByMobileNumber",
        validators: {
            required: true
        },
        label: "Allow others add you by Mobile Number"
    }, {
        id: "age",
        disabled: true,
        validators: {
            required: true
        },
        label: "Show my age"
    }, {
        id: "location",
        disabled: true,
        validators: {
            required: true
        },
        label: "Show my location"
    }, {
        id: "pm",
        disabled: true,
        validators: {
            required: true
        },
        label: "Allow Private Message"
    }];
    this.privacyForm = new formControlService({});
    this.didInit = function() {
        var _this = this;
        this.userInfo = viewIntent.getCurrentIntent().params;
        this.form.forEach(function(item) {
            _this.privacyForm.addField(item.id, {
                value: _this.userInfo.privacy[item.id],
                disabled: item.disabled,
                validators: item.validators
            });
        });
    };

    this.subscriptionCheck = function(event) {
        var _this = this;
        this.isTrial = event.value.isTrial;
        this.isPremiumUser = event.value.isPremiumUser;
        ['age', 'location', 'pm'].forEach(function(key) {
            _this.privacyForm.getField(key).disabled = !event.value.isPremiumUser;
        });
    };

    this.updateSettings = function() {
        var _this = this;
        if (!_this.privacyForm.touched) {
            return;
        }

        jFlirtDataService.updateProfile({
            privacy: _this.userInfo.privacy,
            uid: _this.uid
        }, {
            onSuccess: function() {
                _.$events.$broadcast('settings.privacy', _this.privacyForm.value);
            },
            onError: function() {
                _.alert("unable to update please try again later.", 1000);
            }
        });
    }
}