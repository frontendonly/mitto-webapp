import { ConfigService } from "../../services/config.service";
import {FoAuthService} from '@jeli/materials';
import {StateManager} from '@jeli/core';
Element({
    selector: 'mitto-login',
    templateUrl: './login.component.html',
    DI: [ConfigService, FoAuthService],
    exposeView: true
})
export function LoginElement(configService, foAuthService) {
    this.alreadyLoggedIn = false;
    this.stateManager = new StateManager('normal', null, ['normal','reset', 'register']);
    this.configService = configService;
    this.foAuthService = foAuthService;
}

LoginElement.prototype.onLoginEvent = function(event) {
    if (event.success) {
        this.loadInfoAndNavigate(true);
    } else if (event.reset) {
        this.stateManager.set('password');
    }
};

LoginElement.prototype.onPasswordUpdate = function(event) {
    if (event.success) {
        // do something
        this.foTokenService.putUserInfo({
            forcePasswordReset: false
        });
        this.loadInfoAndNavigate(true);
    }
}

LoginElement.prototype.didInit = function() {
    this.configService.getConfig('config.signedIn,config.loginInfo,config.userData')
    .then((res) => {
        var cData = res.first();
        if (cData.signedIn) {
            this.alreadyLoggedIn = cData.signedIn;
            this.postData = cData.loginInfo;
            this.previousLoggedUserInfo = cData.userData;
        }
    });
}

LoginElement.prototype.switchAccount = function() {
    this.alreadyLoggedIn = false;
    this.previousLoggedUserInfo = {};
}

LoginElement.prototype.loadInfoAndNavigate = function(){
    this.configService.updateConfiguration({
        config: {
            loginInfo: {},
            signedIn: true,
            lastLoginTime: +new Date,
            userData: {}
        }
    });
}