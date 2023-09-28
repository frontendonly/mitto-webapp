import { DataService } from "./data.service";
import { DatabaseService } from "./database.service";

Service({
    DI: [DataService, DatabaseService]
})

/**
 * 
 * @param {*} dataService 
 * @param {*} databaseService 
 */
export function HomeDataService(dataService, databaseService) {
    this.dataService = dataService;
    this.databaseService = databaseService;
}

HomeDataService.prototype.generateSearchParam = function(userInfo) {
    var queryParam = ({
        "inf.location": userInfo.location,
        "inf.gender": userInfo.searchFilter.interested,
        "inf.style": userInfo.style,
        "inf.privacy.available": true,
        "inf.blockedUsers": {
            type: "notInArray",
            value: userInfo.uid
        }
    });

    if ((userInfo.gender == userInfo.searchFilter.interested)) {
        queryParam["inf.searchFilter.interested"] = userInfo.searchFilter.interested;
        queryParam["inf.uid"] = {
            type: "not",
            valu: userInfo.uid
        };
    }

    if (userInfo.searchFilter.hasProfilePic) {
        queryParam['inf.profileImage'] = {
            value : true,
            type: "isDefined"
        }
    }


    return [queryParam];
};

HomeDataService.prototype.getPeopleNearBy = function(whereParam, uid) {
    var query = Object.assign({
        join: [{
            table: "circles",
            clause: "left",
            on: "inf.uid=cir.fid",
            where: "connected",
            fields: this.dataService.parseQuery("CASE(WHEN fid=='%uid%' THEN sid ELSE WHEN sid == '%uid%' THEN fid ELSE null) as fid, COUNT() as isMatch", { uid: uid })
        }, {
            table: "circles",
            clause: "left",
            on: "inf.uid=cir.fid",
            where: "!connected",
            fields: this.dataService.parseQuery("CASE(WHEN fid=='%uid%' THEN sid ELSE WHEN sid == '%uid%' THEN fid ELSE null) as fid, COUNT() as isMyRequest", { uid: uid })
        }, {
            table: "favorite",
            clause: "left",
            on: "inf.uid=fav.fid",
            where: "connected",
            fields: this.dataService.parseQuery("CASE(WHEN uid=='%uid%' THEN sid ELSE WHEN sid == '%uid%' THEN uid ELSE null) as fid, COUNT() as isMyFavorite", { uid: uid })
        }]
    }, whereParam);

    return this.dataService
        .runQuery('select -inf,fav.isMyFavorite,cir.isMatch,cir.isMyRequest -user_info as inf,circles as cir,favorite as fav -%definition%', null, {
            definition: query
        });
};

HomeDataService.prototype.canPerformTask = function(uinfo, task, cb, error) {
    this.dataService.runQuery('select -GET(restrictions.services) -configuration', {
        onSuccess: (res) => {
            var paidService = this.dataService.getPaidService(uinfo),
                restrictionService = res.first().services;
            if (paidService.isPremium || (restrictionService[task].count <= restrictionService[task].limit) || (restrictionService[task].count >= restrictionService[task].limit && (restrictionService[task].timeout || 0) < +new Date)) {
                restrictionService[task].count = ((restrictionService[task].count >= restrictionService[task].limit) ? 1 : (restrictionService[task].count + 1));
                restrictionService[task].timeout = 0;
                cb(1);
            } else {
                // update 
                if (!restrictionService[task].timeout || restrictionService[task].timeout < +new Date) {
                    restrictionService[task].timeout = new Date().setSeconds(21600);
                }
                error(restrictionService[task].timeout);
            }

            // update restrictions
            this.dataService.updateConfiguration({
                restrictions: {
                    services: restrictionService
                }
            });
        }
    })
};

HomeDataService.prototype.PerformTask = function(fid, task) {
    return new Promise((resolve, reject) => {
        this.getCurrentUserInfo()
        .then((uinfo) => {
            this.dataService.canPerformTask(uinfo, 'likes', function(can) {
                // getPaid service
                this[task](uinfo.uid).then(() => resolve(true), reject);
            }, function(timeout) {
                reject({
                    subscriptionRequired: true,
                    timeout: timeout
                });
            })
        });
    });
}

HomeDataService.prototype.like = function(uid, fid){
    var jqlData = {
        data: {
            connected: false,
            creation_date: +new Date,
            fid: fid,
            sid: uid
        },
        where: [{
            fid: uid,
            sid: fid,
            connected: false
        }]
    };

    return new Promise((resolve, reject) => {
        this.databaseService.core.jQl('select -* -circles -where(%where%)', null, jqlData)
        .then((tx) => {
            var query;
            if (tx.jDBNumRows()) {
                jqlData.data.connected = true;
                query = 'update -circles -%data% -%where%';
            } else {
                jqlData.data = [jqlData.data];
                query = 'insert -%data% -circles';
                this.dataService.getUserInfo({ uid: fid });
            }

            this.databaseService.core.jQl(query, null, jqlData).then(resolve, reject);
        }, reject); 
    });
}

HomeDataService.prototype.favorite = function(uid, fid) {
    var postData = [{
        creation_date: +new Date,
        notification: true,
        uid: fid,
        sid: uid
    }];

    return this.databaseService.core.jQl('insert -%0% -favorite', null, [postData]);
}

HomeDataService.prototype.undoLikes = function() {
    return this.databaseService.core.jQl('delete -circles -where -fid=%0% && !connected', null, arguments);
}