Element({
    selector: 'mitto-blocked-users',
    DI: ['viewIntent', "jFlirtDataService", "GlobalService"],
    templateUrl: './blocked-users.html'
}, BlockedUserComponent);

function BlockedUserComponent(viewIntent, jFlirtDataService, _) {
    this.didInit = function() {
        this.userInfo = viewIntent.getCurrentIntent().params;
        this.blockedUsers = [];
        (this.userInfo && this.userInfo.blockedUser || []).forEach(function(user) {
            jFlirtDataService
                .getUserInfo({ uid: user })
                .then(function(res) {
                    this.blockedUsers.push({
                        name: res.data.name,
                        image: res.data.profileImage || _.getGenderImage(res.data.gender),
                        uid: user
                    });
                })
        });
    }

    this.updateSettings = function() {
        jFlirtDataService.updateProfile(this.userInfo, {
            onSuccess: function() {},
            onError: function() {}
        });
    };

    this.unBlockUser = function(idx, uid) {
        this.userInfo.blockedUser.splice(this.userInfo.blockedUser.indexOf(uid), 1);
        this.blockedUsers.splice(idx, 1);
        jFlirtDataService.updateProfile(this.userInfo, {
            onSuccess: function() {},
            onError: function() {
                _.alert("Unable to unblock user, try again.");
            }
        });
    }
}