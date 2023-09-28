import { DataService } from "./services/data.service";
import { GlobalService } from "./services/globalservice.factory";
import { RealTimeService } from "./services/notification.factory";
import {FoAuthService} from '@jeli/materials';
import {ViewIntentService, WebStateService} from '@jeli/router';


Service({
    DI: [
        GlobalService,
        WebStateService,
        DataService,
        FoAuthService,
        RealTimeService,
        ViewIntentService
    ]
})

export function AppEventService(globalService, webStateService, databaseService, foAuthService, realtimeService, viewIntent) {
    this.httpInProgress = false;
    this.userIsActive = foAuthService.userIsActive;
    this.userData = foAuthService.userInfo;
    this.foAuthService = foAuthService;
    this.databaseService = databaseService;
    this.webStateService = webStateService;
    this.realtimeService = realtimeService;
    this.viewIntent = viewIntent;
    this.globalService = globalService;
}

AppEventService.prototype.disconnect = function(closeDB) {
    this.foAuthService.disconnect().then(() => {
        //log the user out from the server
        if (closeDB) {
            this.databaseService.closeDB(true);
        }
    });

    this.webStateService.go('login');
    this.realtimeService.destroyNotification();
    this.viewIntent.destroyAllIntent();
    this.destroySession();
};

AppEventService.prototype.kickUserOutOfPage = function(content) {
    this.globalService
        .confirm(content, [{
            title: "Confirm",
            class: "btn-primary",
            $action: close => {
                close();
                this.webStateService.go("organisation");
            }
        }], false);
};

AppEventService.prototype.destroySession = function(CB, errCB) {
    this.databaseService.core.jQl('update -configuration -%data%', null, {
        data: {
            accessToken: {}
        }
    }).then(CB, errCB);
};