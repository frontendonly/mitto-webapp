import { AlertService } from "./services/alert.service";
import { ConfigService } from "./services/config.service";
import { RealTimeService } from "./services/notification.factory";
import { FoAuthService } from '@jeli/materials';
import { ViewIntentService, WebStateService } from '@jeli/router';


Service({
    DI: [
        AlertService,
        WebStateService,
        FoAuthService,
        RealTimeService,
        ViewIntentService,
        ConfigService
    ]
})

export function AppEventService(alertService, webStateService, foAuthService, realtimeService, viewIntent, configService) {
    this.httpInProgress = false;
    this.foAuthService = foAuthService;
    this.webStateService = webStateService;
    this.realtimeService = realtimeService;
    this.viewIntent = viewIntent;
    this.alertService = alertService;
    this.configService = configService;
}

AppEventService.prototype.disconnect = function (destroySession) {
    // update user configuration with sessionDetails
    if (!destroySession) {
        this.configService.updateConfiguration({
            config: {
                sessionDetails: {
                    tokens: this.foAuthService.foTokenService.getAccessToken(),
                    userInfo: this.foAuthService.foTokenService.getUserInfo(),
                    userId: this.foAuthService.foTokenService.getPrincipal()
                }
            }
        }).then(() => this.leaveSession());
    } else {
        this.foAuthService.disconnect().then(() => this.leaveSession())
    }
};

AppEventService.prototype.leaveSession = function () {
    // disconnect users
    this.foAuthService.foTokenService.destroy();
    this.viewIntent.destroyAllIntent();
    this.webStateService.go('login');
    this.realtimeService.destroyNotification();
}

AppEventService.prototype.kickUserOutOfPage = function (content) {
    this.alertService
        .confirm(content, [{
            label: "Confirm",
            class: "btn-primary",
            action: () => this.webStateService.go('login')
        }], false);
};