import {ViewIntentService} from '@jeli/router';
import { DataService } from '../../services/data.service';

Element({
    selector: 'mitto-blocked-users',
    DI: [ViewIntentService, DataService, 'changeDetector?'],
    templateUrl: './blocked-users.html',
    exposeView: true
})
export function BlockedUserElement(viewIntent, dataService, changeDetector) {
    this.viewIntent = viewIntent;
    this.dataService = dataService;
    this.changeDetector = changeDetector;
    this.userInfo = this.viewIntent.getCurrentIntent().params;
    this.blockedUsers = [];
    this.blockedUsersLen = (this.userInfo.blockedUsers || []).length;
}

BlockedUserElement.prototype.didInit = function() {
    if (this.blockedUsersLen) {
        this.dataService.getBlockedUsers(this.userInfo.blockedUsers)
        .then(res => {
            this.blockedUsers = res.getResult();
            this.changeDetector.detectChanges();
        });
    }
}

BlockedUserElement.prototype.updateProfile = function() {
    if (this.blockedUsersLen == this.userInfo.blockedUsers.length) return;
    this.dataService.updateProfile({
        blockedUsers: this.userInfo.blockedUsers,
        uid: this.userInfo.uid
    });
};

BlockedUserElement.prototype.unBlockUser = function(idx, uid) {
    this.userInfo.blockedUsers.splice(this.userInfo.blockedUser.indexOf(uid), 1);
    this.blockedUsers.splice(idx, 1);
}