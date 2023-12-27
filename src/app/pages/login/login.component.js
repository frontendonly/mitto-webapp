import { ConfigService } from "../../services/config.service";
import {FoTokenService} from '@jeli/materials';
import {StateManager} from '@jeli/core';
import {WebStateService} from '@jeli/router';
import { DataService } from "../../services/data.service";
import { DatabaseService } from "../../services/database.service";
Element({
    selector: 'mitto-login',
    templateUrl: './login.component.html',
    DI: [ConfigService, FoTokenService, WebStateService, DataService, 'changeDetector?'],
    exposeView: true
})
export function LoginElement(configService, foTokenService, webStateService, dataService, changeDetector) {
    this.alreadyLoggedIn = false;
    this.webStateService = webStateService;
    this.dataService = dataService;
    this.stateManager = new StateManager('normal', null, ['normal','reset', 'register']);
    this.configService = configService;
    this.foTokenService = foTokenService;
    this.changeDetector = changeDetector;
    this.hardReset = false;
    this.isConfigLoaded = false;
}

LoginElement.prototype.onLoginEvent = function(event) {
    if (event.success) {
        this.loadInfoAndNavigate(true);
    } else if (event.reset) {
        this.hardReset = true;
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
    this.configService.getConfig('config.signedIn, config.sessionDetails, config.userData')
    .then((res) => {
        var cData = res.first();
        if (cData.signedIn) {
            this.alreadyLoggedIn = (cData.signedIn && !!cData.userData.name);
            this.sessionDetails = cData.sessionDetails;
            this.previousLoggedUserInfo = cData.userData;
        }
        this.isConfigLoaded = true;
        this.changeDetector.detectChanges();
    });
}

LoginElement.prototype.switchAccount = function() {
    this.alreadyLoggedIn = false;
    this.sessionDetails = null;
    this.previousLoggedUserInfo = null;
}

LoginElement.prototype.login = function(){
    var authorizedInstance = this.dataService.databaseService.userServices.createAuthorizeInstance(this.sessionDetails);
    this.foTokenService.saveAuthentication(authorizedInstance);
    this.loadInfoAndNavigate();
}

LoginElement.prototype.loadInfoAndNavigate = function(){
    this.dataService.getCurrentUserInfo()
    .then(userInfo => {
        this.configService.updateConfiguration({
            config: {
                signedIn: true,
                lastLoginTime: +new Date,
                userData: {
                    name: userInfo.name
                },
                sessionDetails: null
            }
        }).then(() => this.webStateService.go('home'));
    });  
}