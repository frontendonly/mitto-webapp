Service()
export function BadgeService() {
    this.cordovaBadge = null;
    if (window.cordova) {
        this.cordovaBadge = cordova.plugins.notification.badge;
        this.cordovaBadge.configure({ autoClear: true });
    }
}

/**
 * 
 * @param {*} methodName 
 * @param {*} arg 
 * @returns 
 */
BadgeService.prototype._callee = function (methodName, arg) {
    if (!this.cordovaBadge) { return; }
    this.cordovaBadge[methodName](arg);
};

BadgeService.prototype.hasPermission = function (CB) {
    this._callee('hasPermission', CB);
};

/**
 * Method Names
     set()
     increase()
     decrease()
     clear();
     get()
     configure();
     hasPermission()
     requestPermission();
 */
BadgeService.prototype.trigger = function (methodName, arg) {
    this._callee(methodName, arg);
};

BadgeService.prototype.set = function (number) {
    if (!window.cordova) { return; }

    this.cordovaBadge.set(number);
}