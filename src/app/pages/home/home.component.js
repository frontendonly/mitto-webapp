import { ViewIntentService } from '@jeli/router';
import { GlobalService } from '../../services/globalservice.factory';
import { RealTimeService } from '../../services/notification.factory';
import { FileUploaderService } from '../../services/file.service';
import { PushNotificationService } from '../../services/pushNotification.service';
import { AlertService } from '../../services/alert.service';
import { NetworkService } from '../../services/network';
import { FoAuthService } from '@jeli/materials';
import { HomeDataService } from '../../services/home.service';
import { httpInProgress } from '../../services/utils';


Element({
    selector: 'mitto-home',
    DI: [
        ViewIntentService,
        GlobalService,
        RealTimeService,
        HomeDataService,
        AlertService,
        FileUploaderService,
        PushNotificationService,
        NetworkService,
        FoAuthService
    ],
    templateUrl: './home.html',
    styleUrl: './home.component.css',
    exposeView: true
})
export function HomeElement(
    viewIntent,
    globalService,
    realtimeService,
    homeDataService,
    alertService,
    fileService,
    pushNotificationService,
    networkService,
    foAuthService
) {
    this.isSubscribed = false;
    this.globalService = globalService;
    this.viewIntent = viewIntent;
    this.realtimeService = realtimeService;
    this.homeDataService = homeDataService;
    this.alertService = alertService
    this.fileService = fileService;
    this.pushNotificationService = pushNotificationService
    this.isAuthenticated = foAuthService.isUserActive;
    this.networkService = networkService;
    this.foAuthService = foAuthService;
    this.accountPaused = false;

    this.CalculateAge = globalService.getUserAge;
    //viewIntent.openActivity('register', {step:1})
    // show loading bar
    this.isLoading = true;
    this.peopleNearBy = [];
    this.myInfo = undefined;
    this.nofif = {};
    this.canReload = false;

    /**
     * register events
     */
    globalService.events.add('settings.filter', () => {
        this.reloadPage();
    });

    globalService.events.add('settings.privacy', (event, privacy) => {
        if (!privacy.available) {
            viewIntent.$destroyAllIntent();
            this.triggerAccountDisabled();
        }
    });

    // initialize pushNotification
    if (window.cordova) {
        pushNotificationService.initializeLocalPush(function () {
            console.log(arguments);
        });
    }

    realtimeService
    .events
    .register('on:load', (res, count) => {
        if (!this.realtimeService.isLoaded || count('user_info')) {
            this.loadHomeData();
        }
    });
}

HomeElement.prototype.didInit = function () {
    httpInProgress.emit(true);
    this.globalService.getGeolocation(loc => {
        this.homeDataService.dataService.getCurrentUserInfo()
            .then((userInfo) => this.intialize(userInfo, loc), () => {
                httpInProgress.emit(false);
                this.isLoading = false;
                this.errorMessage("Unable to retrieve your info, please try again.");
            });
    });
}

HomeElement.prototype.intialize = function (userInfo, loc) {
    // check for user profilePic
    this.downloadProfilePics(userInfo.profileImage, null, userInfo.profileImageUpdate);
    this.myInfo = Object.assign({ isMe: true }, userInfo);
    if (loc) {
        userInfo.geoLocation = loc.latlng;
        userInfo.location = loc.loc.formatted_address;
        // updateProfile
        this.homeDataService.dataService.updateProfile({
            geoLocation: loc.latlng,
            location: loc.loc.formatted_address,
            uid: userInfo.uid
        });
    }

    if (!userInfo.privacy.available) {
        this.triggerAccountDisabled();
    } else {
        this.initializePush();
    }
    httpInProgress.emit(false);
}

/**
 * 
 * @param {*} message 
 */

HomeElement.prototype.errorMessage = function (message) {
    // this.alertService.message(message);
}

// get the user info to load his data
HomeElement.prototype.loadHomeData = function () {
    if (!this.myInfo) {
        this.errorMessage('Unable to retrieve user info.');
        return;
    }

    this.homeDataService
        .getPeopleNearBy({
            where: this.homeDataService.generateSearchParam(this.myInfo),
            limit: "0,50",
            orderBy: "inf.name"
        }, this.myInfo.uid)
        .then(res => this.ongetPeopleNearby(res),
            (err) => {
                this.isLoading = false;
                this.errorMessage('Error Loading updates, please try again later.');
            });
}

/**
 * 
 * @param {*} res 
 */

HomeElement.prototype.ongetPeopleNearby = function (res) {
    var data = res.getResult().filter(item => {
        // filter
        var ageMet = true, kmMet = true;
        if (this.myInfo.searchFilter.minAge && this.myInfo.searchFilter.maxAge) {
            var age = this.globalService.getUserAge(item.inf.age, item.inf.date);
            ageMet = ((age <= this.myInfo.searchFilter.maxAge) && age >= this.myInfo.searchFilter.minAge);
        }
        // set the locationDiff
        item.locationDiff = [0, 'km'];
        if (this.myInfo.searchFilter.minKm && this.myInfo.searchFilter.maxKm) {
            item.locationDiff = this.globalService.printLocationDiff(this.myInfo.geoLocation, item.inf.geoLocation);
            if ((item.locationDiff[1] == 'km')) {
                kmMet = ((item.locationDiff[0] <= this.myInfo.searchFilter.maxKm) && item.locationDiff[0] >= this.myInfo.searchFilter.minKm);
            } else {
                if (this.myInfo.searchFilter.minKm > 0) {
                    kmMet = false;
                }
            }
        }
        return ageMet && kmMet;
    });

    // this.groupData(data);
    this.isLoading = false;
};
/**
 * 
 * @param {*} data 
 */
HomeElement.prototype.groupData = function (data) {
    if (!data.length) return;

    var prev = [0],
        ndata = [],
        len = this.myInfo.searchFilter.maxKm || 50,
        _len = Math.round(len / 5),
        range = [],
        _range = [];

    for (var i = 0; i <= _len; i++) {
        range.push((i * 5) ? (i * 5) : 1);
    }

    range.forEach(function (key) {
        var _data = [];
        data.forEach(function (cdata) {
            var dist = cdata.locationDiff[0] / 1000;
            if ((dist <= key) && key > prev[prev.length - 1] && dist >= prev[prev.length - 1]) {
                _data.push(cdata);
            }
        });

        _range.push(prev[prev.length - 1] + " - " + key);
        prev.push(key);
        ndata.push(_data);
    });
    
    this.peopleNearBy = ndata;
    this.range = _range;
    ndata = null;
}

/**
 * 
 * @param {*} pic 
 */

HomeElement.prototype.downloadProfilePics = function (pic) {
    if (pic) {
        this.fileService.download.apply(this.fileService, arguments);
    }
};

/**
 * 
 * @param {*} userInfo 
 */

HomeElement.prototype.initializePush = function () {
    this.realtimeService
        .pollingQueryData
        .set('user_info', {
            query: {
                where: [{
                    uid: {
                        type: "not",
                        value: this.myInfo.uid
                    },
                    "location": this.myInfo.location,
                    "gender": this.myInfo.searchFilter.interested
                }]
            }
        });

    this.realtimeService.startNotificationPolling(this.myInfo.uid);
    this.loadHomeData();
}


HomeElement.prototype.reloadPage = function () {
    if (this.isLoading) {
        return;
    }

    this.homeDataService.dataService
        .getCurrentUserInfo()
        .then(userInfo => {
            this.myInfo = Object.assign({ isMe: true }, userInfo);
            this.loadHomeData();
        });
};

HomeElement.prototype.getLocationDiff = function (geoLocation) {
    return this.globalService.printLocationDiff(geoLocation, this.myInfo.geoLocation);
};




HomeElement.prototype.openChatBox = function (user) {
    this.homeDataService.dataService
        .canPerformTask(user, 'messages', ()=> {
            this.viewIntent.openIntent('chat', {
                rid: user.uid,
                name: user.name,
                image: user.profileImage
            });
        }, (timeout)=> {
            this.alertService.alertSubscription({
                countdown: timeout
            });
        })
};

/**
 * triggerAccountDisabled
 */

HomeElement.prototype.triggerAccountDisabled = function () {
    this.accountPaused = true;
    this.realtimeService.destroyNotification();
};


HomeElement.prototype.enableAccount = function () {
    this.myInfo.privacy.available = true;
    this.homeDataService
        .updateProfile({
            privacy: this.myInfo.privacy,
            uid: this.myInfo.uid
        }).then(()=> {
            this.accountPaused = false;
            this.initializePush(_this.myInfo);
        });
};


/**
 * Grid calculator
 */
HomeElement.prototype.calculateGridWidth = function (gridTotal) {
    return this.globalService.vw2px(47 * (gridTotal || 1)) + "px";
};

HomeElement.prototype.onSwipeRegistry = function (event) {
    if ((event.value.direction == 'down')) {
        event.value.target.style.marginTop = event.value.distance + "px";
        if (event.value.distance >= 100) {
            this.canReload = true;
        }
    }

    if ((event.value.state == 'end')) {
        event.value.target.style.marginTop = "0px";
        if (this.canReload) {
            this.canReload = false;
            this.loadHomeData();
        }
    }
};