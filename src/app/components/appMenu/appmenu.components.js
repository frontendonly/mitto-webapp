import { AppEventService } from "../../app.service";
import { DataService } from "../../services/data.service";
import { GlobalService } from "../../services/globalservice.factory";

Element({
    selector: 'app-menu',
    DI: [GlobalService, DataService, AppEventService],
    props: ['userInfo', 'isAuthenticated'],
    templateUrl: './app-menu.component.html'
})
export function AppMenuElement(globalService, dataService, appEvent) {
    this.isAuthenticated = false;
    this.userInfo = null;
    this.globalService = globalService;
    this.dataService = dataService;
    this.appEvent = appEvent;
}

AppMenuElement.prototype.logoutUser = function () {
    this.globalService.confirm("<p>Are you sure you want to logout?</p>", [{
        title: 'Proceed',
        $action: ($close) => {
            this.appEvent.disconnect();
            $close();
        }
    }], true);
};

AppMenuElement.prototype.hideAccount = function () {
    this.globalService.openModal({
        title: 'Pause Account',
        templateUrl: './pause-account.html',
        showCloseBtn: true,
        fullScreen: true,
        buttons: [{
            title: "Pause",
            $action: ($close) => {
                $close();
                this.pauseAccount();
            }
        }]
    });
};

AppMenuElement.prototype.pauseAccount = function () {
    this.userInfo.privacy.available = false;
    this.dataService.updateProfile({
        privacy: this.userInfo.privacy,
        uid: this.userInfo.uid
    }).then(() => this.globalService.events.$broadcast('settings.privacy', _this.userInfo.privacy),
        () => this.globalService.alert("<p>unable to update please try again later.</p>", 1000)
    );
};

AppMenuElement.prototype.deleteAccount = function () {
    this.globalService.openModal({
        title: 'Deactivate Account',
        templateUrl: './delete-account.html',
        showCloseBtn: true,
        fullScreen: true,
        buttons: [{
            title: 'Pause',
            $action: ($close) => {
                $close();
                this.pauseAccount();
            }
        }, {
            title: "Deactivate",
            $action: ($close) => {
                this.dataService.deactivateAccount(this.userInfo.uid, () => {
                    $close();
                    this.appEvent.disconnect();
                });
            }
        }]
    });
};