import { DatabaseService } from "./services/database.service";
import {LocationService} from '@jeli/router';
import { httpInProgress } from "./services/utils";

Element({
    selector: 'app-mitto',
    templateUrl: './app.element.html',
    styleUrl: './app.element.scss',
    DI: [DatabaseService, LocationService, 'changeDetector?']
})
export function MittoElement(databaseService, locationService, changeDetector) {
    this.appName = 'mitto';
    this.databaseService = databaseService;
    this.appInitialized = false;
    this.locationService = locationService;
    this.changeDetector = changeDetector;
    this.isLoading = false;
    httpInProgress.subscribe(value => (this.isLoading = value, changeDetector.onlySelf()));
}

MittoElement.prototype.didInit = function(){
    this.databaseService.initDB().then(() => {
        // initialize Application
        console.log('Application initialized')
        this.appInitialized = true;
        this.locationService.initializeRoute(true);
    });
}