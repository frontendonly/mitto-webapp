import { ViewIntentService } from '@jeli/router';
import { AlertService } from '../../services/alert.service';
import { ActionSheet } from '../../services/actionsheet';
import { DataService } from '../../services/data.service';
import { Pronouns, getFlirtStyle, getUserAge, globalEvents, printLocationDiff } from '../../services/utils';

Element({
    selector: 'mitto-profile',
    DI: [ViewIntentService, DataService, ActionSheet, AlertService, 'changeDetector?'],
    templateUrl: './profile.html',
    styleUrl: './profile.scss',
    exposeView: true
})
export function ProfileElement(viewIntent, dataService, actionSheet, alertService, changeDetector) {
    this._currentActivity = viewIntent.getCurrentIntent();
    this.dataService = dataService;
    this.actionSheet = actionSheet;
    this.alertService = alertService;
    this.changeDetector = changeDetector;
    this.user = this._currentActivity.params;
    this.viewIntent = viewIntent;
    this.imageChanged = false;
    this.circles = [];
    this.isBlockedUser = false;
    this.isLoading = true;
    this.isMatch = false;
    this.isMyRequest = false;
    this.isMyFavorite = false;
    this.isMe = this._currentActivity.params.isMe;
    this.currentUserInfo = null;
    this.CalculateAge = getUserAge;

    Object.defineProperties(this, {
        getLocationDiff: {
            get: () => printLocationDiff(this.user.geoLocation, this.currentUserInfo.geoLocation).join(" ")
        }
    })
}
ProfileElement.prototype.didInit = function () {
    this.dataService
        .getCurrentUserInfo()
        .then((userInfo) => {
            if (this.isMe) {
                this.user = userInfo;
            }

            if (!this.isMe) {
                this.currentUserInfo = userInfo;
                this.isBlockedUser = this.isBlockedUser(this.user, userInfo);

                if (!this.isBlockedUser) {
                    this.setMatchOrRequest(userInfo.uid);
                    this.setFavorite(userInfo.uid);
                }
            }

            this.previewCircles = !this.isMe && !this.isBlockedUser && this.isMatch && this.user.privacy.circles;
            if (!this.isMe && !this.isBlockedUser) {
                this.dataService.registerVisitors(this.user.uid, this.currentUserInfo.uid);
            }

            this.changeDetector.detectChanges();
        });
}

ProfileElement.prototype.viewDidLoad = function () {
    /**
         * register event listening
         */
    if (this.isMe) {
        globalEvents.add('profile.on.update', () => {
            this.refreshProfilePage()
        });
    }
}

ProfileElement.prototype.setMatchOrRequest = function (userId) {
    this.dataService.runQuery('select -* -circles -where(%0%)', null, [
        [{
            fid: this.user.uid,
            sid: userId
        }, {
            sid: this.user.uid,
            fid: userId
        }]
    ]).then((res) => {
        var result = res.first();
        if (result) {
            this.isMatch = result.connected;
            this.isMyRequest = (result.sid == userId) && !result.connected;
        }

        this.changeDetector.onlySelf();
    });
};

ProfileElement.prototype.setFavorite = function (userId) {
    this.dataService.runQuery('select -COUNT() -favorite -where(%query%)', null, {
        query: [{
            uid: this.user.uid,
            sid: userId
        }]
    }).then((res) => {
        this.isMyFavorite = res.jDBNumRows();
    });
};


ProfileElement.prototype.refreshProfilePage = function () {
    this.dataService
        .getCurrentUserInfo()
        .then((userInfo) => {
            if (userInfo.profileImageUpdate > this.user.profileImageUpdate) {
                this.imageChangeDispatcher(userInfo.profileImageUpdate);
            }
            this.user = userInfo;
        });
};

// public function
ProfileElement.prototype.PerformTask = function (user, task, mapping) {
    // set the user mapping
    this[mapping] = true;
    this.dataService
        .canPerformTask(task, user.uid)
        .then((isMatch) => {
            if (isMatch) {
                this.isMatch = isMatch;
            }
        }, (timeout) => {
            this[mapping] = false;
            if (res.subscriptionRequired) {
                this.alertService.alertSubscription({
                    countdown: timeout
                });
            }
        });
};

ProfileElement.prototype.setFlirtCategory = function (type) {
    return getFlirtStyle(type);
};

ProfileElement.prototype.openUserMenu = function () {
    var labels = ['Block'];
    if (this.isMatch) {
        labels.push('Unmatch');
    }
    labels.push('Report');

    var actions = {
        1: () => this.blockUser(),
        /**
         * check label length to determine which method to trigger
         * if users arent matched yet trigger reportMethod
         */
        2: () => {
            if (this.isMatch) {
                this.unMatchUser();
            } else {
                this.reportUser();
            }
        },
        3: () => {
            if (this.isMatch) {
                this.reportUser();
            }
        }
    };

    this.actionSheet({
        bottom: true,
        buttonLabels: labels
    }, (idx) => { actions[idx](); });
};

ProfileElement.prototype.undoRequest = function () {
    var paidService = this.dataService.getPaidService(this.user);
    if (!paidService.isPremiumUser) {
        this.alertService.alertSubscription({});
    } else {
        this.dataService
            .PerformTask(this.user.uid, 'undoLikes')
            .then(() => {
                this.user.isMyRequest = false;
            });
    }
};

ProfileElement.prototype.blockUser = function () {
    this.alertService.confirm('<h6>Are you sure you want to block <strong>' + this.user.name + '</strong>? ' + Pronouns[this.user.gender] + ' will be unable to contact you.</h6>', [{
        label: "Block",
        class: 'btn btn-primary',
        dismiss: true,
        action: () => {
            this.dataService.blockUser(this.user.uid);
        }
    }], false);
};

ProfileElement.prototype.unMatchUser = function () {
    this.alertService.confirm('<h6>Are you sure you want to unmatch <strong>' + this.user.name + '</strong>? You can decide to take a break by blocking '+Pronouns[this.user.gender]+'.</h6>', [{
        label: "Unmatch",
        class: 'btn btn-primary',
        dismiss: true,
        action: () => {
            this.dataService.unMatchUser(this.user.uid, () => {
                this.isMatch = this.isMyRequest = false;
            });
        }
    }], false);
};

ProfileElement.prototype.reportUser = function () {
    this.alertService.reportUser({
        data: {
            name: this.user.name,
            id: this.user.uid,
            reporterId: this.currentUserInfo.uid,
            reporterName: this.currentUserInfo.name
        }
    });
}

ProfileElement.prototype.updateProfile = function () {
    this.dataService
        .updateProfile(this.user)
        .then(() => this.pageTitle = this.user.name);
};

ProfileElement.prototype.openProfileSetting = function () {
    this.viewIntent.openActivity('settings.profile');
};


ProfileElement.prototype.openChatBox = function (user) {
    this.dataService
        .canPerformTask(user, 'messages')
        .then(() => {
            this.viewIntent.openIntent('chat', {
                rid: user.uid,
                name: user.name,
                image: user.image
            });
        }, (countdown) => {
            this.alertService.alertSubscription({
                countdown
            });
        })

};

ProfileElement.prototype.viewDidDestroy = function () {
    globalEvents.destroy('profile.on.update');
}