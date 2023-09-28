Element({
    selector: 'mitto-settings-change-password',
    DI: ["GlobalService", "jFlirtDataService", "jDB"],
    templateUrl: './change-password.html'
}, ChangePasswordComponent);

function ChangePasswordComponent(_, jFlirtDataService, jDB) {
    this.passwordForm = {
        misMatch: false,
        passwordStrengthError: false,
        samePasswordError: false,
        newPassword: "",
        oldPassword: ""
    };

    this.changePassword = function() {
        var _api = jDB.tx._users();
        this.passwordForm.misMatch = false;
        this.passwordForm.passwordStrengthError = false;
        this.passwordForm.samePasswordError = false;
        jFlirtDataService
            .runQuery('select -config,userData -configuration', {
                onSuccess: function(res) {
                    var _data = res.first();
                    if (!$isEqual(_data.config.loginInfo.password, this.passwordForm.oldPassword)) {
                        this.passwordForm.misMatch = true;
                        return;
                    }

                    if (this.passwordForm.newPassword < 6) {
                        this.passwordForm.passwordStrengthError = true;
                        return;
                    }

                    if ($isEqual(this.passwordForm.newPassword, this.passwordForm.oldPassword)) {
                        this.passwordForm.samePasswordError = true;
                        return;
                    }

                    _api.updateUser({
                            _data: { password: this.passwordForm.newPassword },
                            _ref: _data.config.userData._ref
                        })
                        .then(function(_res) {
                            if (_res.result.ok) {
                                // this.logoutUser();
                            } else {
                                // _.openModal({
                                //     content: "Unable to change your password.",
                                //     timeout: 3000
                                // });
                            }
                        })
                }
            })
    };

}