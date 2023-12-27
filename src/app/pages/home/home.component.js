import { ViewIntentService } from '@jeli/router';
import { RealTimeService } from '../../services/notification.factory';
import { FileUploaderService } from '../../services/file.service';
import { PushNotificationService } from '../../services/pushNotification.service';
import { AlertService } from '../../services/alert.service';
import { NetworkService } from '../../services/network';
import { FoAuthService } from '@jeli/materials';
import { HomeDataService } from '../../services/home.service';
import { getUserAge, httpInProgress, printLocationDiff, vw2px, globalEvents, getCurrentLocation } from '../../services/utils';


Element({
    selector: 'mitto-home',
    DI: [
        ViewIntentService,
        RealTimeService,
        HomeDataService,
        AlertService,
        FileUploaderService,
        PushNotificationService,
        NetworkService,
        FoAuthService,
        'changeDetector?'
    ],
    templateUrl: './home.html',
    styleUrl: './home.component.scss',
    exposeView: true
})
export function HomeElement(
    viewIntent,
    realtimeService,
    homeDataService,
    alertService,
    fileService,
    pushNotificationService,
    networkService,
    foAuthService,
    changeDetector
) {
    this.isSubscribed = false;
    this.viewIntent = viewIntent;
    this.realtimeService = realtimeService;
    this.homeDataService = homeDataService;
    this.alertService = alertService
    this.fileService = fileService;
    this.changeDetector = changeDetector;
    this.pushNotificationService = pushNotificationService
    this.isAuthenticated = foAuthService.isUserActive;
    this.networkService = networkService;
    this.foAuthService = foAuthService;
    this.accountPaused = false;

    this.CalculateAge = getUserAge;
    //viewIntent.openActivity('register', {step:1})
    // show loading bar
    this.isLoading = true;
    this.peopleNearBy = [];
    this.myInfo = undefined;
    this.nofif = {};
    this.canReload = false;
    this.cardContainer = null;

    /**
     * register events
     */
    globalEvents.add('settings.filter', () => {
        this.loadHomeData();
    });

    globalEvents.add('settings.privacy', (event, privacy) => {
        if (!privacy.available) {
            viewIntent.destroyAllIntent();
            this.triggerAccountDisabled();
        }
    });

    // initialize pushNotification

    realtimeService
        .events
        .register('on:load', (res, count) => {
            if (!this.realtimeService.isLoaded || count('user_info')) {
                this.loadHomeData();
            }
        });

    pushNotificationService.initializeLocalPush(function () {
        console.log(arguments);
    });
}

HomeElement.prototype.didInit = function () {
    httpInProgress.emit(true);
   getCurrentLocation(loc => {
        this.homeDataService.dataService.getCurrentUserInfo()
            .then((userInfo) => this.intialize(userInfo, loc), () => {
                httpInProgress.emit(false);
                this.isLoading = false;
                this.errorMessage("Unable to retrieve your info, please try again.");
            });
    });
}

HomeElement.prototype.intialize = function (userInfo, geoloc) {
    // check for user profilePic
    this.downloadProfilePics(userInfo.profileImage, null, userInfo.profileImageUpdate);
    this.myInfo = Object.assign({ isMe: true }, userInfo);
    if (geoloc) {
        userInfo.geoLocation = Object.assign({}, geoloc.latlng);
        userInfo.location = geoloc.loc.formatted_address || userInfo.location;
        userInfo.age = getUserAge(userInfo.age, userInfo.date);
        // updateProfile
        this.homeDataService.dataService.updateProfile({
            geoLocation: userInfo.geoLocation,
            location: userInfo.location,
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
        return this.errorMessage('Unable to retrieve user info.');
    }

    this.homeDataService.getPeopleNearBy(this.myInfo, {
            limit: "0,50",
        })
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
    this.peopleNearBy = res.filter(item => {
        var kmMet = true;
        var minKm = this.myInfo.searchFilter.minKm || 0;
        var maxKm = this.myInfo.searchFilter.maxKm || 50;
        item.locationDiff = printLocationDiff(this.myInfo.geoLocation, item.geoLocation);
        if ((item.locationDiff[1] == 'km')) {
            kmMet = ((item.locationDiff[0] <= maxKm) && item.locationDiff[0] >= minKm);
        } else if (minKm > 0) {
            kmMet = false;
        }

        return kmMet;
    });

    this.isLoading = false;
    this.changeDetector.detectChanges();
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

HomeElement.prototype.openChatBox = function (user) {
    this.homeDataService
        .dataService
        .canPerformTask(user, 'messages')
        .then(() => {
            this.viewIntent.openIntent('chat', {
                rid: user.uid,
                name: user.name,
                image: user.profileImage
            });
        }, (countdown) => {
            this.alertService.alertSubscription({
                countdown
            });
        })
};

/**
 * triggerAccountDisabled
 */

HomeElement.prototype.triggerAccountDisabled = function () {
    this.accountPaused = true;
    this.realtimeService.destroyNotification();
    this.changeDetector.onlySelf();
};


HomeElement.prototype.enableAccount = function () {
    this.myInfo.privacy.available = true;
    this.homeDataService
        .dataService
        .updateProfile({
            privacy: this.myInfo.privacy,
            uid: this.myInfo.uid
        }).then(() => {
            this.accountPaused = false;
            this.initializePush();
        });
};


/**
 * Grid calculator
 */
HomeElement.prototype.calculateGridWidth = function (gridTotal) {
    return vw2px(47 * (gridTotal || 1)) + "px";
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
}

HomeElement.prototype.onCardAction = function (event) {
    if (event.type == 'swipe') {
        var removed = null;
        if ((event.action === 'accept')) {
            this.homeDataService.PerformTask('likes', this.peopleNearBy[0].inf.uid)
                .then(() => { }, err => {
                    console.log(err);
                });
        }

        setTimeout(() => {
            removed = this.peopleNearBy.splice(0, 1);
            this.changeDetector.detectChanges();
        }, event.fromButton ? 300 : 10);
    } else {
        this.openChatBox(this.peopleNearBy[0].inf);
    }
}