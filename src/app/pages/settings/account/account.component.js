Element({
    selector: 'mitto-settings-account',
    DI: ['viewIntent', "GlobalService", "jFlirtDataService", "appEvent"],
    templateUrl: './account.html'
}, AccountSettingsComponent);

function AccountSettingsComponent(viewIntent, _, jFlirtDataService, appEvent) {
    this.userInfo = {};
    this.didInit = function() {
        this.userInfo = viewIntent.getCurrentIntent().params;
    };


}