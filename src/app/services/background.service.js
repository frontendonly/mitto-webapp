import { DatabaseService } from "./database.service";
Service({
    DI: [DatabaseService]
})
export function BackgroundService(databaseService) {
    this.databaseService = databaseService;
    this.timer = 300000, // equivalent to 5mins
    this._interval = null;
}

BackgroundService.prototype.start = function ($id) {
    this._interval = setTimeout(function () {
        getUserInfoUpdates($id);
    }, timer);
}

BackgroundService.prototype.destroy = function () {
    clearTimeout(this._interval);
}

BackgroundService.prototype.getUserInfoUpdates = function ($id) {
    var fetchUpdate = (list) => {
        var idx = 0;
        var next = () => {
            if (list.length > idx) {
                load(idx);
            } else {
                this._interval = setTimeout(() => this.getUserInfoUpdates($id), timer)
            }
        };
        
        var load = (cur) => {
            this.databaseService.core.clientService
                .getOne('user_info', {
                    uid: list[idx].uid,
                    "data.lastModified": {
                        "lt": list[cur].lastModified || +new Date
                    }
                })
                .then(res => {
                    this.checkImageUpdate(res, list[cur].profileImageUpdate);
                    next();
                    timer -= ((timer > 60000) ? 30 : 0);
                }, function () {
                    next();
                    timer += 30;
                });
            idx++;
        };

        load(0);
    };

    this.databaseService.core.jQl('select -uid,GET(data.lastModified),GET(data.profileImageUpdate) -user_info -where(uid !==' + $id + ' && data.lastModified)')
    .then(res => fetchUpdate(res.getResult()));
};


BackgroundService.prototype.checkImageUpdate = function (res, profileImageUpdate) {
    var info = res.first();
    if (info) {
        if ((profileImageUpdate !== info.data.profileImageUpdate)) {
            console.log('downloading new image')
            $fileService.download(info.data.profileImage, null, true);
        }
    }

    info = null;
}