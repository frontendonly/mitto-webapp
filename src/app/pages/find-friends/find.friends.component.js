Element({
    selector: 'mitto-find-friends',
    DI: ["jFlirtDataService", "GlobalService"],
    templateUrl: './find-friends.html'
}, FindFriendsComponent);

function FindFriendsComponent(jFlirtDataService, _) {
    var count = 0,
        searchRestrictions = {};
    this.search = {
        restriction: false,
        timeout: 0,
        results: [],
        type: 'username'
    };
    this.userInfo = {};

    this.didInit = function() {
        var _this = this;
        jFlirtDataService
            .runQuery('select -* -configuration', {
                onSuccess: function(res) {
                    searchRestrictions = res.first().restrictions.search;
                    if (searchRestrictions.timeout && searchRestrictions.timeout > +new Date) {
                        _this.search.restriction = true;
                        _this.search.timeout = searchRestrictions.timeout;
                    }
                }
            })

        jFlirtDataService
            .getCurrentUserInfo()
            .then(function(userInfo) {
                _this.userInfo = userInfo;
            });
    };

    this.validate = function(str) {
        return (str.indexOf('@') > -1 ? str : "@" + str);
    };

    this.searchUsers = function() {
        var _this = this;
        if (this.search.field) {
            this.search.results = [];
            this.searchMessage = "Searching.....";
            var params = {
                param: {
                    gender: this.userInfo.searchFilter.interested,
                    blockedUser: {
                        $notInArray: this.userInfo.uid
                    },
                    "privacy.available": true
                },
                limit: "JDB_SINGLE"
            };

            params.param[this.search.type] = this.search.field;
            if ($isEqual('username', this.search.type)) {
                params.param["privacy.addByMittoId"] = true;
            } else {
                params.param["privacy.addByMobileNumber"] = true;
            }

            jFlirtDataService
                .searchPeopleServer(params, this.userInfo.uid)
                .then(function(_res) {
                    // close the 
                    _this.searchMessage = "";
                    _this.search.results = _res.result._rec.map(function(item) { return item._data; });
                    if (!_this.search.results.length) {
                        _this.searchMessage = "User not found";
                        count++;
                        if (count >= 5) {
                            _this.search.restriction = true;
                            jFlirtDataService
                                .updateConfiguration({
                                    restrictions: {
                                        search: {
                                            timeout: new Date().setSeconds(21600)
                                        }
                                    }
                                });
                        }
                    }
                }, function() {
                    _this.searchMessage = "User not found";
                })
        }
    };
}