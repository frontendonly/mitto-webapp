Element({
    selector: 'mitto-profile',
    DI: ['viewIntent', "GlobalService", "jFlirtHomeDataService", '$actionSheet', 'alertService', '$sesionSerivce'],
    templateUrl: './profile.html',
    styleUrl: './profile.css'
}, ProfileComponent);

function ProfileComponent(viewIntent, _, jFlirtDataService, $actionSheet, alertService) {
    var _currentAcitivty = viewIntent.getCurrentIntent();
    this.user = _currentAcitivty.params;
    this.imageChanged = false;
    this.circles = [];
    this.isBlockedUser = false;
    this.isLoading = true;
    this.isMatch = false;
    this.isMyRequest = false;
    this.isMyFavorite = false;
    this.isMe = _currentAcitivty.params.isMe;
    this.currentUserInfo = null;

    this.didInit = function() {
        var _this = this;
        jFlirtDataService
            .getCurrentUserInfo()
            .then(function(userInfo) {
                if (_this.isMe) {
                    _this.user = userInfo;
                }

                if (!_this.isMe) {
                    _this.currentUserInfo = userInfo;
                    _this.isBlockedUser = _.isBlockedUser(_this.user, userInfo);

                    if (!_this.isBlockedUser) {
                        _this.setMatchOrRequest(userInfo.uid);
                        _this.setFavorite(userInfo.uid);
                    }
                }

                _this.previewCircles = !_this.isMe && !_this.isBlockedUser && _this.isMatch && _this.user.privacy.circles;
            });
    }

    this.viewDidLoad = function() {
        var _this = this;
        if (!this.isMe && !this.isBlockedUser) {
            jFlirtDataService.registerVisitors(this.user.uid, this.currentUserInfo.uid);
        }

        /**
         * register event listening
         */
        if (this.isMe) {
            _.$events.mitto('profile.on.update', function() {
                _this.refreshProfilePage()
            });
        }
    }

    this.setMatchOrRequest = function(userId) {
        var _this = this;
        jFlirtDataService.runQuery('select -* -circles -where(%query%)', {
            onSuccess: function(res) {
                var result = res.first();
                if (result) {
                    _this.isMatch = result.connected;
                    _this.isMyRequest = $isEqual(result.sid, userId) && !result.connected;
                }
            },
            onError: function() {}
        }, {
            query: [{
                fid: _this.user.uid,
                sid: userId
            }, {
                sid: _this.user.uid,
                fid: userId
            }]
        });
    };

    this.setFavorite = function(userId) {
        var _this = this;
        jFlirtDataService.runQuery('select -COUNT() -favorite -where(%query%)', {
            onSuccess: function(res) {
                _this.isMyFavorite = res.jDBNumRows();
            }
        }, {
            query: [{
                uid: _this.user.uid,
                sid: userId
            }]
        });
    };


    this.refreshProfilePage = function() {
        var _this = this;
        jFlirtDataService
            .getCurrentUserInfo()
            .then(function(userInfo) {
                if (userInfo.profileImageUpdate > _this.user.profileImageUpdate) {
                    _this.imageChangeDispatcher(userInfo.profileImageUpdate);
                }
                _this.user = userInfo;
            });
    };

    // public function
    this.PerformTask = function(user, task, mapping) {
        var _this = this;
        // set the user mapping
        this[mapping] = true;
        jFlirtDataService
            .PerformTask(user.uid, task)
            .then(function(isMatch) {
                if (isMatch) {
                    _this.isMatch = isMatch;
                }
            }, function(timeout) {
                _this[mapping] = false;
                if (res.subscriptionRequired) {
                    alertService.alertSubscription({
                        countdown: timeout
                    });
                }
            });
    };

    this.getLocationDiff = function() {
        return _.printLocationDiff(this.user.geoLocation, this.currentUserInfo.geoLocation).join(" ");
    };

    this.setFlirtCategory = function(type) {
        return _.getFlirtStyle(type);
    };

    this.openUserMenu = function() {
        var _this = this,
            labels = ['Block'];
        if (this.isMatch) {
            labels.push('Unmatch');
        }
        labels.push('Report');

        $actionSheet({
            bottom: true,
            buttonLabels: labels
        }, function(idx) {
            switch (idx) {
                case (1):
                    _this.blockUser();
                    break;
                case (2):
                    /**
                     * check label length to determine which method to trigger
                     * if users arent matched yet trigger reportMethod
                     */
                    if (labels.length > 2) {
                        _this.unMatchUser();
                    } else {
                        _this.reportUser();
                    }
                    break;
                case (3):
                    if (_this.user.isMatch) {
                        _this.reportUser();
                    }
                    break;
            }
        });
    };

    this.undoRequest = function() {
        var _this = this;
        var paidService = jFlirtDataService.getPaidService(this.user);
        if (!paidService.isPremiumUser) {
            alertService.alertSubscription({});
        } else {
            jFlirtDataService
                .PerformTask(this.user.uid, 'undoLikes')
                .then(function(res) {
                    _this.user.isMyRequest = false;
                });
        }
    };

    this.blockUser = function() {
        var _this = this;
        _.confirm('<h6>Are you sure you want to block ' + this.user.name + '? He/she will be unable to contact you.</h6>', [{
            title: "Block",
            action: function($close) {
                jFlirtDataService.blockUser(_this.user.uid);
                $close();
            }
        }], true);
    };

    this.unMatchUser = function() {
        var _this = this;
        _.confirm('<h6>Are you sure you want to unmatch ' + this.user.name + '? You can decide to take a break by blocking them.</h6>', [{
            title: "Unmatch",
            action: function($close) {
                jFlirtDataService.unMatchUser(_this.user.uid, function() {
                    _this.user.isMatch = _this.user.isMyRequest = false;
                    // $model.closeActivity();
                });
            }
        }], true);
    };

    this.reportUser = function() {
        alertService.reportUser({
            reportData: {
                name: this.user.name,
                id: this.user.uid,
                reporterId: this.currentUserInfo.uid,
                reporterName: this.currentUserInfo.name
            }
        });
    }

    this.updateProfile = function() {
        var _this = this;
        jFlirtDataService
            .updateProfile(this.user, {
                onSuccess: function() {
                    _this.pageTitle = _this.user.name;
                },
                onError: function() {}
            });
    };

    this.openProfileSetting = function() {
        viewIntent.openActivity('settings.profile');
    };

    this.CalculateAge = _.getUserAge;
    this.openChatBox = function(user) {
        jFlirtDataService
            .canPerformTask(user, 'messages', function() {
                viewIntent.openIntent('chat', {
                    rid: user.uid,
                    name: user.name,
                    image: user.image
                });
            }, function(timeout) {
                alertService.alertSubscription({
                    countdown: timeout
                });
            })

    };

    this.viewDidDestroy = function() {
        _.$events.$destroy('profile.on.update');
    }
}

ProfileComponent.prototype.imageChangeDispatcher = function() {
    console.log('dispatching event');
}