import { DataService } from "./data.service";
import { DatabaseService } from "./database.service";
import { cryptoUtils } from '@jeli/materials';

Service({
    name: 'CoinsDataService',
    DI: [DatabaseService, DataService]
})
export function CoinsDataService(databaseService, dataService) {
    this.dataService = dataService;
    this.databaseService = databaseService;
    this.getCoinsInfo = function () {
        return databaseService.core.jQl('select -* -coins');
    };
}

CoinsDataService.prototype.getCoinsHistory = function (uid) {
    return this.databaseService.core.jQl('select -CASE(WHEN receiver=="' + uid + '" THEN sender ELSE WHEN sender == "' + uid + '" THEN receiver ELSE WHEN sender=="mitto-admin" THEN receiver ELSE null) as rid, amount, date, CASE(WHEN receiver=="' + uid + '" THEN false ELSE WHEN sender == "' + uid + '" THEN true ELSE null) as debit,name -coins_history -%0%', null, [{
        lookup: {
            table: 'user_info',
            fields: 'name',
            merge: true,
            key: 'CASE(WHEN receiver=="' + uid + '" THEN "sender" ELSE WHEN sender == "' + uid + '" THEN "receiver" ELSE null)',
            on: 'uid'
        },
        limit: "0,10",
        order: "D"
    }]);
};

CoinsDataService.prototype.selectUser = function (user, uid) {
    var joinQuery = [{
        join: [{
            table: "circles",
            clause: "inner",
            on: "inf.uid=c.fid",
            where: "connected",
            fields: "CASE(WHEN fid=='" + uid + "' THEN sid ELSE WHEN sid == '" + uid + "' THEN fid ELSE null) as fid"
        }],
        where: [{
            uid: {
                type: 'not',
                value: uid
            },
            username: {
                type: 'lk',
                value: user
            }
        }],
        filterBefore: true
    }];

    return this.databaseService.core.jQl('select -inf.name as name,inf.profileImage as image, inf.uid -user_info as inf, circles as c -%0%', null, joinQuery);
}

CoinsDataService.prototype.changePin = function (cData, isNewPin) {
    var postData = {
        disabled: false,
        last_updated: +new Date
    };

    return new Promise((resolve, reject) => {
        var processChanges = (cryptValues) => {
            console.log(cryptValues);
            postData.pin = cryptValues[0];
            if (isNewPin) {
                postData.total = 100;
                postData.uid = cData.uid;
                this.databaseService.core.jQl("batch -%0%", null, [
                    [{
                        table: 'coins',
                        type: 'insert',
                        data: [postData]
                    }, {
                        table: "coins_history",
                        type: "insert",
                        data: [{
                            amount: 100,
                            receiver: postData.uid,
                            sender: "mitto-admin",
                            date: +new Date
                        }]
                    }]
                ]).then(resolve, reject);
            } else {
                this.databaseService.core.jQl("select -pin as oldPin -coins")
                    .then(res => {
                        var data = res.first();
                        if ((data.oldPin == cryptValues[1])) {
                            this.databaseService.core.jQl('update -coins -%0%', null, [postData]).then(resolve, reject);
                        } else {
                            reject({
                                message: "You have entered an invalid pin."
                            });
                        }
                    }, reject);
            }
        }

        cryptoUtils.generateMultiple([cData.newPin, cData.verifyPin])
            .then(processChanges);
    })
};

CoinsDataService.prototype.updateCoins = function () {
    return this.databaseService.core.jQl('update -coins -%0%', null, arguments);
};

CoinsDataService.prototype.getCoinsTotal = function (uid) {
    return this.databaseService.core.jQl("select -amount,sender -coins_history")
        .then((res) => {
            var debit = 0,
                credit = 0;
            res.getResult().forEach(function (item) {
                if (item.sender == uid) {
                    debit = debit + parseInt(item.amount);
                } else {
                    credit = credit + parseInt(item.amount);
                }
            });

            return { debit, credit };
        })
}

CoinsDataService.prototype.setCoinsHistory = function () {
    return this.databaseService.core.jQl('insert -%0% -coins_history', null, arguments);
};

CoinsDataService.prototype.transferCoins = function (postData) {
    return new Promise((resolve, reject) => {
        cryptoUtils.generate(postData.pin)
            .then(hashValue => {
                this.databaseService.core.jQl("select -pin,total -coins")
                    .then((res) => {
                        var coin = res.first();
                        if ((coin.pin !== hashValue)) {
                            reject({
                                message: "You have entered an invalid pin"
                            });
                        } else {
                            this.databaseService.core.jQl('batch -%0%', null, [
                                [{
                                    table: 'coins',
                                    type: 'update',
                                    data: { total:(coin.total - postData.amount), last_updated: +new Date }
                                },
                                {
                                    table: 'coins_history',
                                    type: 'insert',
                                    data: [{
                                        amount: postData.amount,
                                        sender: postData.sender,
                                        receiver: postData.receiver
                                    }]
                                }]
                            ]).then(resolve, reject);
                        }
                    });
            })
    });
};

CoinsDataService.prototype.purchases = function () {
    return this.databaseService.core.jQl('select -coinsPurchase -configuration');
}