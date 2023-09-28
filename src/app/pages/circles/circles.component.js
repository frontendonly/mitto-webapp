Element({
    selector: 'mitto-circles',
    DI: ['viewIntent', "jDB", "jFlirtDataService", "GlobalService", "alertService"],
    templateUrl: './circles.html',
    styleUrl: './circle.css'
}, CirclesComponent);

function CirclesComponent(viewIntent, jDB, jFlirtDataService, _, alertService) {
    this.circleData = [];
    var query = "select -%columns%  -%table% -%definition%";
    this.userInfo = {};
    this.performQuery = function() {
        var _this = this,
            data = { uid: this.userInfo.uid };
        var replacer = {
            table: "user_info as inf, " + this._currentActivity.data.tables + " as m",
            columns: "inf",
            definition: {
                join: [{
                    table: 'm',
                    clause: "right",
                    on: "inf.uid=m.fid"
                }]
            }
        };

        switch (this._currentActivity.name) {
            case ('interest'):
                replacer.definition.join[0].where = "uid=" + data.uid;
                replacer.definition.join[0].fields = jFlirtDataService.parseQuery("CASE(WHEN uid=='%uid%' THEN sid ELSE WHEN sid == '%uid%' THEN uid ELSE null) as fid", data);
                break;
            case ('likes'):
                replacer.definition.join[0].where = "!connected && fid=" + data.uid;
                replacer.definition.join[0].fields = jFlirtDataService.parseQuery("CASE(WHEN fid=='%uid%' THEN sid ELSE WHEN sid == '%uid%' THEN fid ELSE null) as fid", data);
                break;
            case ('visitors'):
                replacer.definition.join[0].where = "notification && visitor_id=" + data.uid;
                replacer.definition.join[0].fields = jFlirtDataService.parseQuery("CASE(WHEN visitor_id=='%uid%' THEN visitor_uid ELSE WHEN visitor_uid == '%uid%' THEN visitor_id ELSE null) as fid", data);
                break;
            case ('match'):
                replacer.definition.join[0].where = jFlirtDataService.parseQuery("connected && fid=%uid% || connected && sid=%uid%", data);
                replacer.definition.join[0].fields = jFlirtDataService.parseQuery("CASE(WHEN fid=='%uid%' THEN sid ELSE WHEN sid == '%uid%' THEN fid ELSE null) as fid", data);
                break;
        }
        jDB.tx
            .jQl(query, {
                onSuccess: function(res) {
                    _this.circleData = res.getResult();
                },
                onError: console.log
            }, replacer);
    }

    this.open = function(userInfo) {
        if (this.canViewInfo()) {
            viewIntent.openIntent('profile', userInfo);
        } else {
            this.openSubscription();
        }
    };

    this.openSubscription = function() {
        alertService.alertSubscription();
    };

    this.canViewInfo = function() {
        return this.subscriberInfo.isPremiumUser || this.isMatchView;
    };

    this.blurImage = function(circle) {
        return !this.canViewInfo();
    };

    this.didInit = function() {
        var _this = this;
        this._currentActivity = viewIntent.getCurrentIntent();
        this.labels = this._currentActivity.data.labels;
        jFlirtDataService
            .getCurrentUserInfo()
            .then(function(userInfo) {
                _this.userInfo = userInfo;
                _this.performQuery();
                _this.isMatchView = $isEqual(_this.labels.title.toLowerCase(), 'match');
                _this.isFavorites = $isEqual(_this.labels.title.toLowerCase(), 'favorites');
            });
    };

    this.subscriptionCheck = function(event) {
        this.subscriberInfo = event.value;
    };
}