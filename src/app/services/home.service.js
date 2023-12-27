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


HomeDataService.prototype.getPeopleNearBy = function(userInfo, params) {
    var values = Object.assign({
        location: userInfo.location,
        interested: userInfo.searchFilter.interested,
        style: userInfo.style,
        uid: userInfo.uid,
        allowSameSexSearch: (userInfo.gender == userInfo.searchFilter.interested),
        withProfilePic: userInfo.searchFilter.hasProfilePic,
        maxAge: userInfo.searchFilter.maxAge || 40,
        minAge: userInfo.searchFilter.minAge || 18
    }, params);
    
    return this.databaseService.core.clientService.query({
        id:'peopleNearby',
        values
    });
};

/**
 * 
 * @param {*} task 
 * @param {*} fid 
 * @returns 
 */
HomeDataService.prototype.PerformTask = function(task, fid) {
    return new Promise((resolve, reject) => {
        this.getCurrentUserInfo()
        .then((uinfo) => {
            this.dataService.canPerformTask(uinfo, task)
            .then(() => {
                // getPaid service
                this[task](uinfo.uid, fid).then(() => resolve(true), reject);
            }, function(timeout) {
                reject({
                    subscriptionRequired: true,
                    timeout: timeout
                });
            })
        });
    });
}

HomeDataService.prototype.likes = function(uid, fid){
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