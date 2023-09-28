Element({
    selector: 'mitto-manage-coins',
    DI: ['viewIntent', "GlobalService", "jFlirtCoinsDataService", "$bnBOX", "$money"],
    templateUrl: './manage-coins.html'
}, ManageCoinsComponent);

function ManageCoinsComponent(viewIntent, _, jFlirtCoinsDataService, $bnBOX, $money) {
    this.userInfo = {};
    this.hasPin = false;
    this.totalCoins = 0;
    this.historys = [];
    this.accordionList = {
        history: true,
        buy: false,
        resetPin: false
    };

    this.currency = $money.getCurrencies();
    this.transfer = {
        error: [],
        form: {}
    };

    /**
     * default selected coins purchase
     */
    this.selected = 2;
    //load all history
    this.loadHistory = function() {
        var _this = this;
        jFlirtCoinsDataService
            .getCoinsHistory(this.userInfo.uid, {
                onSuccess: function(res) {
                    _this.historys = res.getResult();
                },
                onError: console.log
            });
    };

    this.setKlass = function(isDebit) {
        return (isDebit) ? 'active' : '';
    };

    this.setArrowKlass = function(isDebit) {
        return 'fa-arrow-circle-' + ((!isDebit) ? 'down green-text' : 'up red-text');
    };

    this.purchase = function(coin, idx) {
        viewIntent.openIntent('checkout', {
            amount: $money.fx(coin.amount).to(this.currency),
            currency: this.currency,
            description: "Mitto coins purchase (" + coin.value + " units)"
        });

        this.selected = idx;
    };

    this.changePin = function() {
        var _this = this;
        if (!this.pinForm.newPin) {
            return;
        }
        //set the UID
        this.pinForm.uid = this.userInfo.uid;
        jFlirtCoinsDataService.changePin(this.pinForm, !this.hasPin, {
            onSuccess: function(res) {
                if (!_this.hasPin) {
                    _this.hasPin = true;
                    _this.totalCoins = 100;
                } else {
                    _this.setAccordion('resetPin');
                    _.alert("Pin Successfully Changed!!");
                }
            },
            onError: function(err) {
                _.alert(err.message);
            }
        });
    };

    this.selectUser = function() {
        var _this = this;
        if (!this.transfer.form.user) {
            this.circleList = [];
            return;
        }

        jFlirtCoinsDataService
            .selectUser(this.transfer.form.user, this.userInfo.uid, {
                onSuccess: function(res) {
                    _this.circleList = res.getResult();
                },
                onError: function() {}
            });
    };

    this.addUser = function(user) {
        this.transfer.form.user = user.name;
        this.transfer.form.receiver = user.uid;
        this.transfer.form.sender = this.userInfo.uid;
        this.circleList = [];
    };

    this.canTransfer = function() {
        return Object.keys(this.transfer.form).length > 3;
    };


    this.submit = function() {
        var _this = this;
        this.transfer.error = [];
        jFlirtCoinsDataService.transferCoins(this.transfer.form)
            .then(function() {
                _this.totalCoins = this.totalCoins - this.transfer.form.amount;
                _this.transfer.form = {};
                _.alert("Transfer Successful!!");
                _this.loadHistory();
            }, function(err) {
                _this.transfer.error = err;
            });
    };

    this.validator = function(field) {
        var _this = this;
        var actions = {
            amount: function() {
                if (_this.transfer.form.amount > _this.totalCoins) {
                    _this.transfer.error[field] = "You need " + (_this.transfer.form.amount - _this.totalCoins) + "MTC, please buy more coins";
                } else {
                    delete this.transfer.error[field];
                }
            },
            pin: function() {

            }
        };

        (actions[field] || function() {})()
    }

    this.setAccordion = function($accord) {
        this.accordionList[$accord] = !this.accordionList[$accord];
    };

    this.showAccordion = function($accord) {
        return this.accordionList[$accord] ? "block" : "none";
    };

    this.changePin = function() {
        this.pinForm.uid = this.userInfo.uid;
        jFlirtCoinsDataService.changePin(this.pinForm, !this.hasPin, {
            onSuccess: function(res) {
                this.hasPin = true;
                _.alert("Pin Successfully Changed!!");
            },
            onError: function(err) {
                _.openModal(err.message);
            }
        });
    };



    this.viewDidDestroy = function() {
        $bnBOX.events.unregister("events.coins.history");
    };

    this.didInit = function() {
        var _this = this;
        // load user info
        jFlirtCoinsDataService.getCurrentUserInfo()
            .then(function(data) {
                _this.userInfo = data;
            });

        // get coins info
        jFlirtCoinsDataService
            .getCoinsInfo({
                onSuccess: function(res) {
                    _this.hasPin = res.jDBNumRows();
                    if (_this.hasPin) {
                        _this.totalCoins = res.first().total;
                        _this.accordionList.buy = true;
                    } else {
                        _this.accordionList.resetPin = true;
                    }

                    jFlirtCoinsDataService
                        .getCoinsTotal(_this.userInfo.uid, function(debit, credit) {
                            _this.totalCoins = (credit - debit);
                        });
                }
            });

        jFlirtCoinsDataService
            .runQuery('select -coinsPurchase -configuration', {
                onSuccess: function(res) {
                    _this.coinsPurchase = res.first().coinsPurchase;
                }
            });

        //init process
        this.loadHistory();
        $bnBOX.events.register("events.coins.history", function(res, getCount) {
            if (getCount('_coins_history')) {
                _this.loadHistory();
            };
        });
    }

}