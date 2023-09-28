import {WebStateService} from '@jeli/router';
import { DatabaseService } from '../../services/database.service';

Element({
    selector: 'mitto-splash-screen',
    styleUrl: './splash-screen.scss',
    DI: [DatabaseService, WebStateService],
    templateUrl: './splash-screen.html',
    exposeView: true
});
export function SplashScreenElement(databaseService, webStateService) {
   this.databaseService = databaseService;
   this.webStateService = webStateService;
}

SplashScreenElement.prototype.didInit = function() {
    // this.databaseService.initDB(() => {
        
    //     this.webStateService.go('home');
    // });
};