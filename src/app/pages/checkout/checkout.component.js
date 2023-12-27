import {ViewIntentService} from '@jeli/router';
import { DatabaseService } from '../../services/database.service';
Element({
    selector: 'mitto-checkout',
    DI: [ViewIntentService, DatabaseService],
    templateUrl: './checkout.html',
    exposeView: true
})
export function CheckoutElement(viewIntent, databaseService) {
    this.param = viewIntent.getCurrentIntent().params;
    this.databaseService = databaseService;
    this.paymentProcessing = false;
    this.paymentSuccessful = false;
    this.cardAuthControl = null;
    this.token = 'pkey_test_5935f6h3luzfwpui6jj';
}

CheckoutElement.prototype.processPayment = function(response) {
    console.log(response)
    // var _this = this;
    // if (!$isEqual(status_code, 200)) {
    //     this.paymentProcessing = false;
    //     _.alert(response.message, 3000);
    //     return;
    // }

    // jDB.core.api('/application/omise/payment', {
    //         paymentDetails: {
    //             amount: this.param.amount,
    //             currency: this.param.currency,
    //             card: response.id,
    //             description: this.param.description
    //         },
    //         historyDetails: {
    //             last_four: response.card.last_digits,
    //             brand: response.card.brand,
    //             chargeId: response.id,
    //             total: this.param.amount
    //         }
    //     })
    //     .then(function(checkoutResponse) {
    //         _this.paymentSuccessful = true;
    //         // dataService.updateUserDB({
    //         //     paid: true,
    //         //     next_recurrent: ((+new Date) + 2592000 * 1000)
    //         // }, {
    //         //     db_name: appName
    //         // }, noop, noop);
    //         // // send email to user
    //         // email.send({
    //         //     recipients: [{
    //         //         email: appEvent.userData._data.email,
    //         //         name: appEvent.userData._data.fullname
    //         //     }],
    //         //     subject: "Receipt for " + appName,
    //         //     emailParser: {
    //         //         data: {
    //         //             title: "Receipt for " + appName,
    //         //             sender_name: "Billing Team",
    //         //             product_name: "FrontEndOnly",
    //         //             appName: appName,
    //         //             name: appEvent.userData._data.fullname,
    //         //             action_url: "https://frontendonly.com/#/billing/" + appName,
    //         //             credit_card_last_four: response.card.last_digits,
    //         //             credit_card_brand: response.card.brand,
    //         //             receipt_id: "",
    //         //             description: "Payment for " + appName + " application.",
    //         //             amount: amount,
    //         //             total: amount,
    //         //             download_link: ""
    //         //         },
    //         //         templateUrl: ["header.html", "receipt.html"]
    //         //     }
    //         // }, true);
    //     }, function(err) {
    //         _this.paymentSuccessful = false;
    //         _this.paymentError = true;
    //     });
}