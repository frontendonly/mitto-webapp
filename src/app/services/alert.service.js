import { GlobalService } from "./globalservice.factory";

Service({
    DI: [GlobalService]
})
export function AlertService(globalservice) {
    this.globalservice = globalservice;
}

AlertService.prototype.alertSubscription = function(options) {
    this.globalservice.openModal(extend({}, {
        template: '<mitto-subscription {close-modal}="$close"></mitto-subscription>',
        fullScreen: true
    }, options | {}));
};

AlertService.prototype.message = function(message, timeout) {
    this.globalservice.openModal({
        title: 'Alert',
        template: message
    });
};

AlertService.prototype.disabledAccount = function(options) {
    this.globalservice.openModal({
        template: '<div class="center-align"><h5 class="red-text">Account Paused</h5></div>',
        hideCloseBtn: true,
        fullScreen: true,
        buttons: [{
            title: "Enable Account",
            $action: function($close) {
                $close();
                modalInstance = null;
                options.enableAccount();
            }
        }]
    });
};

AlertService.prototype.reportUser = function(definition) {
    this.globalservice.openModal(Object.assign({}, {
        template: '<report-user-modal {close-modal}="$close" {report-data}="modal.reportData"></report-user-modal>',
        fullScreen: true
    }, definition));
};