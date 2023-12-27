import { ViewIntentService } from '@jeli/router';
import { AppEventService } from "../../app.service";
import { DataService } from "../../services/data.service";
import { AlertService } from '../../services/alert.service';
import { globalEvents } from '../../services/utils';

Element({
    selector: 'mitto-nav-bar',
    props: ['userInfo', 'isAuthenticated'],
    templateUrl: './nav-bar.component.html',
    styleUrl: './nav-bar-element.scss',
    DI: [ViewIntentService, AlertService, DataService, AppEventService]
})
export function NavBarElement(viewIntentService, alertService, dataService, appEvent) {
    this.barIsVisible = false;
    this.viewIntentService = viewIntentService;
    this.userInfo = null;
    this.alertService = alertService;
    this.dataService = dataService;
    this.appEvent = appEvent;
    this.isAuthenticated = false;
    this.notif = {};
    this.appName = "Mitto";
    this.openMenu = false;
}

NavBarElement.prototype.performAction = function (menu) {
    var actions = {
        openPage: () => {
            this.viewIntentService.openIntent(menu.pageId, this.userInfo);
        },
        hide: () => this.alertService.openModal({
            title: 'Pause Account',
            template: '<div class="fw-light">\
            <p>Your account will be hidden from other users.</p>\
            <p>However you remain visible to users within your circles, receive messages and access other features.</p></div>',
            showCloseBtn: true,
            modalStyle: 'modal-fullscreen',
            buttons: [{
                label: "Pause",
                class: 'btn btn-primary',
                dismiss: true,
                action: () => this.pauseAccount()
            }]
        }),
        del: () => this.alertService.openModal({
            title: 'Deactivate Account',
            template: '<div class="fw-light">\
            Are you sure you want to deactivate your account?\
            <p>You can click on pause to hide your account.</p>\
            <p>Click on deactivate to proceed with your account deactivation.</p></div>',
            showCloseBtn: true,
            modalStyle: 'modal-fullscreen',
            buttons: [{
                label: 'Pause',
                class: 'btn btn-primary',
                dismiss: true,
                action: () => this.pauseAccount()
            }, {
                label: "Deactivate",
                class: 'btn btn-danger',
                dismiss: true,
                action: () => this.dataService.deactivateAccount(this.userInfo.uid, () => this.appEvent.disconnect(true))
            }]
        }),
        logout: () => this.alertService.confirm("<p>Are you sure you want to logout?</p>", [{
            label: 'Proceed',
            class: 'btn btn-primary',
            dismiss: true,
            action: () => this.appEvent.disconnect()
        }], false)
    };

    this.openMenu = !this.openMenu;
    actions[menu.action]();
}



NavBarElement.prototype.pauseAccount = function () {
    this.userInfo.privacy.available = false;
    this.dataService.updateProfile({
        privacy: this.userInfo.privacy,
        uid: this.userInfo.uid
    }).then(() => globalEvents.dispatch('settings.privacy', this.userInfo.privacy),
        () => this.alertService.alert("<p>Unable to pause account, please try again later!</p>", 1000)
    );
};