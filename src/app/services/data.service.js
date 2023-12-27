import { ConfigService } from "./config.service";
import { DatabaseService } from "./database.service";
import { FoAuthService } from '@jeli/materials';

Service({
    DI: [DatabaseService, ConfigService, FoAuthService]
})
export function DataService(databaseService, configService, foAuthService) {
    this.databaseService = databaseService;
    this.configService = configService;
    this.foAuthService = foAuthService
}

DataService.prototype.parseQuery = function (query, data) {
    return query.replace(/\%(.*?)\%/g, function (a, key) {
        return data.hasOwnProperty(key) ? data[key] : key;
    })
};

DataService.prototype.isUserNameExists = function(username){
    return new Promise((resolve) => {
        if (!username) return resolve(false);
        this.databaseService.core.clientService.getNumRows({username}, 'user_info')
        .then(res => resolve((!res._jDBNumRows)), () => resolve(false));
    });
}

DataService.prototype.getAge = function (age) {
    return new Date().getFullYear() - parseInt(age);
};

DataService.prototype.storeUserInfo = function (data, CB) {
    this.databaseService.core.jQl('insert -%0% -user_info', null, [data])
        .then(CB, console.log)
};

DataService.prototype.canPerformTask = function(uinfo, task) {
    return new Promise((resolve, reject) => {
        this.runQuery('select -restrictions.services -configuration')
        .then((res) => {
            var paidService = this.getPaidService(uinfo),
                restrictionService = res.first().services;
            if (paidService.isPremium || (restrictionService[task].count <= restrictionService[task].limit) || (restrictionService[task].count >= restrictionService[task].limit && (restrictionService[task].timeout || 0) < +new Date)) {
                restrictionService[task].count = ((restrictionService[task].count >= restrictionService[task].limit) ? 1 : (restrictionService[task].count + 1));
                restrictionService[task].timeout = 0;
                resolve(1);
            } else {
                // update 
                if (!restrictionService[task].timeout || restrictionService[task].timeout < +new Date) {
                    restrictionService[task].timeout = new Date().setSeconds(21600);
                }
                reject(restrictionService[task].timeout);
            }
    
            // update restrictions
            this.configService.updateConfiguration({
                restrictions: {
                    services: restrictionService
                }
            });
        })
    })
};

DataService.prototype.getUserInfo = function (query, uData) {
    return new Promise((resolve, reject) => {
        this.databaseService.core.jQl('select -* -user_info -where(%query%)', null, {
            query: [query]
        }).then(res => {
            var rec = res.first();
            if (rec) {
                resolve(rec);
            } else {
                this.databaseService.core.clientService
                    .getOne('user_info', query)
                    .then((result) => {
                        if (result.jDBNumRows()) {
                            resolve(result.first() || {});
                        } else {
                            reject({
                                error: "Info not found"
                            });
                        }
                    });
            }
        });
    });
};

DataService.prototype.getCurrentUserInfo = function () {
    return this.getUserInfo({ uid: this.foAuthService.userId });
};

DataService.prototype.updateProfile = function (info) {
    return this.databaseService.core.jQl('update -user_info -%data% -%query%', null, {
        data: info,
        query: { uid: info.uid }
    });
};

DataService.prototype.runQuery = function (query, handler, replacer) {
    return this.databaseService.core.jQl(query, handler, replacer || {});
};

DataService.prototype.searchPeopleServer = function (query) {
    query.tables = ['user_info'];
    return this.databaseService.core.clientService.query(query);
};

DataService.prototype.registerVisitors = function (uid, sid) {
    var whereClause = [{
        visitor_id: uid,
        visitor_uid: sid
    }];

    this.runQuery('select -* -visitors -where(%0%)', null, [whereClause]).then(tx => {
        var len = tx.jDBNumRows();
        var query = 'insert -[%postData%] -visitors';

        if (len) {
            query = 'update -visitors -%postData% -%whereClause%';
        }

        this.runQuery(query, null, {
            postData: {
                visitor_id: uid,
                visitor_uid: sid,
                notification: true,
                last_visit: +new Date
            },
            whereClause: whereClause
        });
    });
};

DataService.prototype.getCircles = function (data) {
    return this.databaseService.core.clientService.query({
        where: [{
            "fid": "fid",
            "sid": data.user,
            "connected": 1
        },
        {
            "sid": "sid",
            "fid": data.user,
            "connected": 1
        }],
        join: {
            "user_info": {
                queries: {
                    "info": {
                        where: [{
                            "uid": "fid",
                            "sid": {
                                "$not": data.user
                            }
                        },
                        {
                            "uid": "sid",
                            "fid": {
                                "$not": data.user
                            }
                        }]
                    }
                }
            }
        },
        fields: {
            info: "user_info._data"
        },
        limit: "10"
    }, 'circles');
};

DataService.prototype.getPaidService = function (userInfo) {
    var timeDiff = new Date((userInfo.subScriptionDetails || {}).sub_date || userInfo.date).setSeconds(24 * 30 * 60 * 60),
        isTrial = timeDiff > (+new Date),
        isPremiumUser = userInfo.isPaid;
    return {
        isTrial: isTrial,
        isPremiumUser: isPremiumUser
    };
};

DataService.prototype.blockUser = function (uid) {
    this.getCurrentUserInfo()
        .then(user => {
            if (!user.data.blockedUser) {
                user.data.blockedUser = [];
            }

            if (user.data.blockedUser.includes(uid)) {
                user.data.blockedUser.push(uid);
                this.updateProfile(user);
            }
        });
};

DataService.prototype.unMatchUser = function (uid) {
    // remove user messages
    returnnthis.runQuery([
        'delete -messages -where -(receiver == %uid% || sender == %uid%)',
        'delete -circles -where -(fid == %uid% || sid == %uid%)',
        'delete -favorite -where -(uid == %uid% || sid == %uid%)',
        'delete -visitors -where -(visitor_id == %uid% || visitor_uid == %uid%)'
    ], null, { uid });
};

DataService.prototype.deactivateAccount = function (uid, CB) {
    this.runQuery([
        'delete -coins_history',
        'delete -coins',
        'delete -messages',
        'delete -circles',
        'delete -favorite',
        'delete -visitors',
        'delete -user_info -where -uid=%0%',
        'select -* -configuration'
    ], null, [uid])
        .then(res => {
            var details = res[7].first();
            if (details) {
                this.databaseService.userService.remove(details.config.loginInfo)
            }

            this.configService.updateConfiguration({
                config: {
                    loginInfo: {},
                    userData: {}
                }
            }).then(CB)
        });
};

DataService.prototype.getBlockedUsers = function(blockedUsers){
    return this.databaseService.core.jQl('select -name,profileImage,gender,uid -user_info -%0%', null, [{
        where: [{
            uid: {
                type: 'inArray',
                value: blockedUsers
            }
        }]
    }])
}