import {FoAuthService} from '@jeli/materials';

Element({
    selector: 'mitto-settings-change-password',
    DI: [FoAuthService],
    templateUrl: './change-password.html',
    exposeView: true
})
export function ChangePasswordElement(foAuthService) {
    this.foAuthService = foAuthService;
}
