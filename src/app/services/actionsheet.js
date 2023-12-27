import {ModalService} from '@jeli/materials';

Service({
    name: '$actionSheet',
    DI: [ModalService]
})
export function ActionSheet(modalService) {
    this.modalService = modalService;
    var _defaultActionSheet = {
        androidTheme: (window.cordova ? window.plugins.actionsheet.ANDROID_THEMES.THEME_DEVICE_DEFAULT_LIGHT : ""), // material
        addCancelButtonWithLabel: 'Cancel',
        androidEnableCancelButton: true,
        winphoneEnableCancelButton: true,
        destructiveButtonLast: true
    }

    return (options, callback) => {
        if (window.cordova) {
            window.plugins.actionsheet.show(Object.assign({}, _defaultActionSheet, options), callback);
            return;
        }
        
       this.modalService.createModal(Object.assign({
        title: 'Select Action',
        displayType: 'block',
        modalStyle: 'modal-dialog-end',
        buttons: options.buttonLabels.map((label, idx) => ({
            label,
            class: 'col-12 btn btn-primary ms-2',
            dismiss: true,
            action: () => callback(idx + 1)
        }))
       }, options)).open();
    };
}