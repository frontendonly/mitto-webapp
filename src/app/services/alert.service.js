import { ReportUserModalElement } from "../components/report-user/report-user.component";
import { MittoScubsriptionElement } from "../components/subscription/subscription.component";
import {ModalService} from '@jeli/materials';

Service({
    DI: [ModalService]
})
export function AlertService(modalService) {
    this.modalService = modalService;
}

AlertService.prototype.openModal = function(options){
    this.modalService.createModal(options).open(); 
}

AlertService.prototype.alertSubscription = function(options) {
    this.modalService.createModal(Object.assign({
        modalStyle: 'modal-fullscreen',
        title: 'Subscription Plans',
        component: MittoScubsriptionElement,
        backDrop: false,
    }, options || {})).open();
};

AlertService.prototype.message = function(message, timeout) {
    this.modalService.createModal({
        title: 'Alert',
        template: message,
        modalStyle: 'modal-dialog-centered'
    }).open();
};

AlertService.prototype.disabledAccount = function(options) {
    this.modalService.createModal({
        template: '<div class="center-align"><h5 class="red-text">Account Paused</h5></div>',
        hideCloseBtn: true,
        modalStyle: 'modal-fullscreen',
        buttons: [{
            label: "Enable Account",
            dismiss: true,
            action: function() {
                options.enableAccount();
            }
        }]
    });
};

AlertService.prototype.reportUser = function(definition) {
    this.modalService.createModal(Object.assign({
        component: ReportUserModalElement,
        modalStyle: 'modal-fullscreen',
        title: 'Report ' + definition.data.name
    }, definition)).open();
}

AlertService.prototype.alert = function(msg, timer, showCloseBtn) {
    var modalInstance = this.modalService.createModal({
        title: "Alert",
        displayType: 'block',
        template: msg,
        modalStyle: "modal-sm modal-dialog-centered",
        hideCloseBtn: showCloseBtn
    });
    modalInstance.open();
    setTimeout(() => modalInstance.close(), timer || 2000);
};

AlertService.prototype.confirm = function(msg, button, showCloseBtn) {
    return this.modalService.createModal({
        title: "Please confirm",
        displayType: 'block',
        template: msg,
        modalStyle: "modal-sm modal-dialog-centered",
        buttons: button,
        hideCloseBtn: showCloseBtn
    }).open();
};