Service({
    name: 'jFlirtCoinsDataService',
    DI: ['$promise', 'jDB', 'jFlirtDataService']
}, jFlirtCoinsServiceFn);

function jFlirtCoinsServiceFn($promise, jDB, jFlirtDataService) {
    var jCoinService = Object.create(jFlirtDataService);
    jCoinService.getCoinsInfo = function(handlers) {
        jDB.tx.jQl('select -* -coins', handlers);
    };


    jCoinService.getCoinsHistory = function(uid, handlers) {
        jDB.tx.jQl('select -inf.name, ch.amount, ch.date, ch.debit, inf.uid -user_info as inf, coins_history as ch -' + JSON.stringify({
            join: [{
                table: "coins_history",
                clause: "right",
                on: "inf.uid=ch.rid",
                fields: jCoinService.parseQuery(
                    "CASE(WHEN receiver=='%uid%' THEN sender ELSE WHEN sender == '%uid%' THEN receiver ELSE WHEN sender=='incognito-user' THEN receiver ELSE null) as rid, amount, date, CASE(WHEN receiver=='%uid%' THEN false ELSE WHEN sender == '%uid%' THEN true ELSE null) as debit", { uid: uid })
            }],
            limit: "0,10"
        }), handlers);
    };

    jCoinService.selectUser = function(user, uid, handlers) {
        var self = jCoinService,
            ret = [],
            inc = 0,
            joinQuery = JSON.stringify({
                join: [{
                    table: "circles",
                    clause: "inner",
                    on: "inf.uid=c.fid",
                    where: "connected",
                    fields: jCoinService.parseQuery("CASE(WHEN fid==%uid% THEN sid ELSE WHEN sid == %uid% THEN fid ELSE null) as fid", { uid: uid })
                }],
                where: "uid !== " + uid + " && username:like:" + user
            });

        jDB.tx.jQl('select -GET(inf.data.name) as name,GET(inf.data.profileImage) as image, inf.uid -user_info as inf, circles as c -' + joinQuery, handlers);
    }

    jCoinService.changePin = function(cData, isNewPin, handlers) {
        var postData = {
                disabled: false,
                last_updated: +new Date,
                pin: cData.newPin
            },
            query;
        if (isNewPin) {
            postData.date = +new Date;
            postData.total = 100;
            postData.uid = cData.uid;

            jDB.tx.jQl("batch -%data%", handlers, {
                data: [{
                    table: 'coins',
                    type: 'insert',
                    data: [postData]
                }, {
                    table: "coins_history",
                    type: "insert",
                    data: [{
                        amount: 100,
                        receiver: postData.uid,
                        sender: "incognito-user",
                        date: +new Date
                    }]
                }]
            });

        } else {
            jDB.tx.jQl("select -pin as oldPin -coins", {
                onSuccess: function(res) {
                    var pin = res.first();
                    if ($isEqual(pin.oldPin, cData.oldPin)) {
                        jDB.tx.jQl('update -coins -' + JSON.stringify(postData), handlers);
                    } else {
                        handlers.onError({
                            message: "You have entered an invalid pin."
                        });
                    }
                },
                onError: function(err) {
                    console.log(err);
                }
            })
        }
    };

    jCoinService.updateCoins = function(data, CB) {
        this.runQuery('update -coins -%data%', {
            onSuccess: CB || function() {},
            onError: console.log
        }, {
            data: data
        });
    };

    jCoinService.getCoinsTotal = function(uid, CB) {
        this.runQuery("select -amount,sender -coins_history", {
            onSuccess: function(res) {
                var debit = 0,
                    credit = 0,
                    inc = 0,
                    total = res.jDBNumRows();
                res.getResult().forEach(function(item) {
                    inc++;
                    if (item.sender == uid) {
                        debit = debit + parseInt(item.amount);
                    } else {
                        credit = credit + parseInt(item.amount);
                    }

                    if (inc === total) {
                        CB(debit, credit);
                    }
                });

                if (!total) {
                    CB(debit, credit);
                }
            }
        })
    }

    jCoinService.setCoinsHistory = function(data, CB) {
        jDB.tx.jQl('insert -%data% -coins_history', {
            onSuccess: CB || function() {},
            onError: console.log
        }, {
            data: data
        });
    };

    jCoinService.transferCoins = function(postData) {
        var promise = new $promise(),
            self = jCoinService;
        jDB.tx.jQl("select -pin as oldPin -coins", {
            onSuccess: function(res) {
                var coins = res.first();
                if (!$isEqual(coins.oldPin, postData.pin)) {
                    promise.reject({
                        pin: "You have entered an invalid pin"
                    })
                } else {

                    self.setCoinsHistory([{
                        amount: postData.amount,
                        receiver: postData.receiver,
                        sender: postData.sender,
                        date: +new Date
                    }], function(res) {
                        promise.resolve(res);
                    });
                }
            }
        });

        return promise;
    };

    return jCoinService;

}