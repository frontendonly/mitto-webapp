import { DataService } from "./data.service";
Service({
    DI: [DataService]
})
export function PushNotificationService(dataService) {
    this._events_ = {};
    this.localNotification;
    this.dataService = dataService;
    this.events = {
        register: function(name, fn) {
            push.on(name, fn || $noop);
            _events_[name] = fn || $noop;
        },
        unregister: function(name) {
            push.off(name, _events_[name]);
        }
    };
}

PushNotificationService.prototype.initialize = function(definition) {
    push.on('registration', (data) => {
        this.dataService.updateConfiguration({
            pushNotification: data
        });
    });

    PushNotification.init(definition || {});
};

PushNotificationService.prototype.hasPermission = function(CB) {
    PushNotification.hasPermission(CB);
};


PushNotificationService.prototype.initializeLocalPush = function(CB) {
    if (!window.cordova) return;
    this.localNotification = cordova.plugins.notification.local;
    this.localNotification.hasPermission(granted => {
        if (!granted) {
            this.localNotification.registerPermission(CB);
        } else {
            CB(granted);
        }
    });
};

PushNotificationService.prototype.scheduleNotification = function(definition, click, triggered) {
    if (!this.localNotification) { return; }
    this.localNotification.schedule(definition);
    this.registerLocalNotificationEvent("click", click);
    this.registerLocalNotificationEvent("trigger", triggered);
};

PushNotificationService.prototype.localNotificationEvent = function(name, fn) {
    if (name && fn) {
        this.localNotification.on(name, fn);
    }
};

PushNotificationService.prototype.cancelLocalNotificationEvent = function() {
    this.localNotification.cancel.apply(this.localNotification, arguments);
}
