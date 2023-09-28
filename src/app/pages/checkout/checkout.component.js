Element({
    selector: 'mitto-checkout',
    DI: ['viewIntent', 'GlobalService', 'jDB', 'jAuthService', 'formControlService'],
    templateUrl: './checkout.html'
}, CheckoutComponent);

function CheckoutComponent(viewIntent, _, jDB, jAuthService, formControlService) {
    this.param = viewIntent.getCurrentIntent().params;
    this.paymentProcessing = false;
    this.paymentSuccessful = false;
    this.cardAuthControl = null;
    /**
     * omise form object
     */
    this.form = {};
    this.validForm = function() {
        return Object.keys(this.form)
            .filter(function(key) {
                switch (key) {
                    case ('name'):
                        return this.form[key].length < 3;
                        break;
                    case ('number'):
                        return this.form[key].length < 14;
                        break;
                    case ('expiration_month'):
                        return this.form[key].length < 2;
                        break;
                    case ('expiration_year'):
                        return this.form[key].length < 4;
                        break;
                    case ('security_code'):
                        return this.form[key].length < 3;
                        break;
                }
            });
    }

    /**
     * on checkout
     */
    this.onCheckout = function() {
        var _this = this;
        this.paymentProcessing = true;
        Omise.createToken('card', this.cardAuthControl.value, function(statusCode, response) {
            _this.omiseTokenSuccess(statusCode, response);
        });
    };

    this.errorHandler = function(err) {
        if (err.code === -100) {
            this.errMsg = "All feilds are required";
            return;
        } else if (err.code === -102) {
            this.errMsg = _.generateErrorMsg(err).join('<br>');
        }
    };

    this.omiseTokenSuccess = function(status_code, response) {
        var _this = this;
        if (!$isEqual(status_code, 200)) {
            this.paymentProcessing = false;
            _.alert(response.message, 3000);
            return;
        }

        jDB.core.api('/application/omise/payment', {
                paymentDetails: {
                    amount: this.param.amount,
                    currency: this.param.currency,
                    card: response.id,
                    description: this.param.description
                },
                historyDetails: {
                    last_four: response.card.last_digits,
                    brand: response.card.brand,
                    chargeId: response.id,
                    total: this.param.amount
                }
            })
            .then(function(checkoutResponse) {
                _this.paymentSuccessful = true;
                // dataService.updateUserDB({
                //     paid: true,
                //     next_recurrent: ((+new Date) + 2592000 * 1000)
                // }, {
                //     db_name: appName
                // }, noop, noop);
                // // send email to user
                // email.send({
                //     recipients: [{
                //         email: appEvent.userData._data.email,
                //         name: appEvent.userData._data.fullname
                //     }],
                //     subject: "Receipt for " + appName,
                //     emailParser: {
                //         data: {
                //             title: "Receipt for " + appName,
                //             sender_name: "Billing Team",
                //             product_name: "FrontEndOnly",
                //             appName: appName,
                //             name: appEvent.userData._data.fullname,
                //             action_url: "https://frontendonly.com/#/billing/" + appName,
                //             credit_card_last_four: response.card.last_digits,
                //             credit_card_brand: response.card.brand,
                //             receipt_id: "",
                //             description: "Payment for " + appName + " application.",
                //             amount: amount,
                //             total: amount,
                //             download_link: ""
                //         },
                //         templateUrl: ["header.html", "receipt.html"]
                //     }
                // }, true);
            }, function(err) {
                _this.paymentSuccessful = false;
                _this.paymentError = true;
            });
    }

    this.didInit = function() {
        /**
         * Omise config
         */
        var _this = this;
        var date = new Date();
        Omise.setPublicKey('pkey_test_5935f6h3luzfwpui6jj');
        this.cardAuthControl = new formControlService({
            number: {
                validators: {
                    required: true,
                    minlength: 14,
                    isNumber: function(val) {
                        return !isNaN(Number(val));
                    },
                    valid_card: this.valid_credit_card
                }
            },
            name: {
                validators: {
                    required: true,
                    minlength: 6
                }
            },
            expiration_month: {
                validators: {
                    required: true,
                    maxlength: 2,
                    minlength: 2
                }
            },
            expiration_year: {
                validators: {
                    required: true,
                    minlength: 4,
                    maxlength: 4,
                    isCurrentYearAndPastMonth: validateYear
                }
            },
            security_code: {
                validators: {
                    required: true,
                    minlength: 3,
                    maxlength: 3,
                    isNumber: function(val) {
                        return !isNaN(Number(val));
                    }
                }
            }
        });

        function validateYear(val) {
            if (!_this.cardAuthControl.value.expiration_month) {
                return false;
            }
            var currentYear = date.getFullYear();
            return !((currentYear === val && (date.getMonth() + 1) >= _this.cardAuthControl.value.expiration_month) || currentYear > val);
        }
    };

    function getCardType(number) {
        return [
            { regex: /^4/, type: "visa" },
            { regex: /^(5[1-5][0-9]{14}|2(22[1-9][0-9]{12}|2[3-9][0-9]{13}|[3-6][0-9]{14}|7[0-1][0-9]{13}|720[0-9]{12}))$/, type: "mastercard" },
            { regex: /^3[47]/, type: "amex" },
            { regex: /^(6011|622(12[6-9]|1[3-9][0-9]|[2-8][0-9]{2}|9[0-1][0-9]|92[0-5]|64[4-9])|65)/, type: "discover" },
            { regex: /^(36|30[0-5])/, type: "diners-club" },
            { regex: /^35(2[89]|[3-8][0-9])/, type: "jcb" }
        ].filter(function(t) { return t.regex.test(number); })[0];
    }

    this.getCardType = function(number) {
        var test = getCardType(number);
        return test ? ("fa-cc-" + test.type) : "";
    };


    // takes the form field value and returns true on valid number
    this.valid_credit_card = function(value) {
        value = (value || '').toString();
        // accept only digits, dashes or spaces
        if (/[^0-9-\s]+/.test(value)) return false;
        // The Luhn Algorithm. It's so pretty.
        var nCheck = 0,
            nDigit = 0,
            bEven = false;
        value = value.replace(/\D/g, "");
        for (var n = value.length - 1; n >= 0; n--) {
            var cDigit = value.charAt(n),
                nDigit = parseInt(cDigit, 10);

            if (bEven) {
                if ((nDigit *= 2) > 9) nDigit -= 9;
            }

            nCheck += nDigit;
            bEven = !bEven;
        }

        return (nCheck % 10) == 0;
    };
}