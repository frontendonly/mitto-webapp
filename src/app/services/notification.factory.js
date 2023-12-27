import { BadgeService } from "./badge.service";
import { DatabaseService } from "./database.service";
import { FileUploaderService } from "./file.service";
import { PushNotificationService } from "./pushNotification.service";

Service({
    DI: [DatabaseService, BadgeService, FileUploaderService, PushNotificationService]
})
export function RealTimeService(databaseService, badgeService, fileService, pushNotificationService) {
    this._id = null;
    this._polling;
    this._events = {},
    this._pushId = 0;
    this._notiType = null;
    this._JSONDATA = null;
    this._notiData = {};
    this.databaseService = databaseService;
    this.badgeService = badgeService;
    this.fileService = fileService;
    this.pushNotificationService = pushNotificationService;
    this.queries = {};
    this.pollingQueryData = {
        set: (tbl, value) => {
            this.queries[tbl] = value;
            return this;
        },
        get: tbl => {
            return this.queries[tbl] || {};
        }
    };

    this.events = {
        register: (name, fn) => {
            this._events[name] = fn;
        },
        unregister: (name) => {
            delete this._events[name];
        },
        trigger: (result, count) => {
            Object.values(this._events).forEach(function(event) {
                event(result, count);
            });
        }
    };
}

RealTimeService.prototype.startNotificationPolling = function(id) {
    this._id = id;
    /**
     * build Polling Query
     */
    var pollQueryBuilder = () => {
        return ({
            circles: {
                query: {
                    where: [{
                        "fid": id
                    },
                    {
                        "sid": id
                    }]
                }
            },
            visitors: {
                query: {
                    where: [{
                        "visitor_id": id,
                        "notification": true
                    },
                     {
                        "visitor_uid": id,
                        "notification": true
                    }]
                }
            },
            favorite: {
                query: {
                    where: [{
                        "uid": id,
                        "notification": true
                    }]
                }
            },
            messages: {
                query: {
                    where: [{
                        "sender": id
                    },
                    {
                        "receiver": id
                    }]
                }
            },
            coins_history: {
                query: {
                    where: [{
                        sender: id
                    },
                    {
                        receiver: id
                    }]
                }
            },
            coins: {
                query: {
                    where: [{
                        uid: id
                    }]
                }
            },
            user_info: this.pollingQueryData.get('user_info')
        });
    };

    this.dbUpdateInstance = this.databaseService.core.onUpdate({
        timer: 30000,
        payload: pollQueryBuilder
    });

    this.dbUpdateInstance.start((event) => {
        this.processResult(event);
    });
};

RealTimeService.prototype.processResult = function(res) {
    if (this.isLoaded) {
        var notif = {
            favorites: res.count('favorite'),
            visitors: res.count('visitors'),
            likes: res.count("insert", "circles"),
            match: res.count("circles", "update"),
            message: res.count("messages", "insert")
        };

        // $rootModel.$publish('notification.new')(notif);
        var total = 0;
        Object.keys(notif).map(function(key) {
            total = total + notif[key];
        });
        /**
         * set badge 
         */
        this.badgeService.set(total);
        /**
         * load all images
         */
        this.checkImageUpdate(res.getData("insert", "user_info"));
        this.buildLocalNotifications(notif, res);

    } else {
        /**
         * load all images
         */
        this.checkImageUpdate(res.getData("insert", "user_info"));
    }

    // trigger our events watch
    this.events.trigger(res.result, res.count);
    this.isLoaded = true;
};

RealTimeService.prototype.destroyNotification = function() {
    if (this.dbUpdateInstance) {
        this.dbUpdateInstance.disconnect();
    }
};

RealTimeService.prototype.checkImageUpdate = function(list) {
    for(var item of  list) {
        if (item.profileImage && !(item.profileImage.indexOf('base64') > -1)) {
            this.fileService.download(item.profileImage, null, null, item.profileImageUpdate);
        }
    }
}


RealTimeService.prototype.buildLocalNotifications = function(notif, res) {
    var notifObject = Object.keys(notif).reduce((accum, key) => {
        if (notif[key]) {
            accum.push({
                id: _pushId,
                text: "You have " + notif[key] + " " + key,
                at: new Date(+new Date + 5 * 1000),
                led: "FF0000",
                referer: key
            });

           this._pushId++;
        }
        return accum;
    }, []);

    this.pushNotificationService.scheduleNotification(notifObject, function(obj) {
        console.log(obj);
    });
}