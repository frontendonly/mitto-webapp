Service({
    name: '$actionSheet',
    DI: ['GlobalService']
}, actionSheetFn);

function actionSheetFn(_) {
    var _defaultActionSheet = {
        androidTheme: (window.cordova ? window.plugins.actionsheet.ANDROID_THEMES.THEME_DEVICE_DEFAULT_LIGHT : ""), // material
        addCancelButtonWithLabel: 'Cancel',
        androidEnableCancelButton: true,
        winphoneEnableCancelButton: true,
        destructiveButtonLast: true
    }

    return function(options, callback) {
        options = extend({}, _defaultActionSheet, options);
        if (window.cordova) {
            window.plugins.actionsheet.show(options, callback);
            return;
        }
        var modalInstance;
        options.trigger = function(idx) {
            modalInstance.$close();
            callback(idx + 1);
        };

        options.customClass = "custom-bottom-modal";
        modalInstance = _.openModal(options);
    };
}