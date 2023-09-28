Element({
    selector: 'mitto-settings-change-pin',
    DI: ["GlobalService", "jFlirtCoinsDataService"],
    templateUrl: './change-pin.html'
}, ChangePinComponent);

function ChangePinComponent(_, jFlirtCoinsDataService) {
    this.hasPin = false;
    this.pinForm = {};
    this.didInit = function() {
        var _this = this;
        jFlirtCoinsDataService
            .getCoinsInfo({
                onSuccess: function(res) {
                    _this.hasPin = res.jDBNumRows();
                }
            });
    }


    this.changePin = function() {
        //set the UID
        this.pinForm.uid = this.userInfo.uid;
        jFlirtCoinsDataService.changePin(this.pinForm, false, {
            onSuccess: function(res) {
                _.alert("Pin Successfully Changed!!", 3000);
            },
            onError: function(err) {
                _.alert(err.message);
            }
        });
    };
}