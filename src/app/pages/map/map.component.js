import { AlertService } from "../../services/alert.service";
import { GoogleMapService } from "../../services/google.map.service";
import { ViewIntentService } from '@jeli/router';

Element({
    selector: 'mitto-map',
    DI: [GoogleMapService, ViewIntentService, AlertService],
    templateUrl: './map.html',
    exposeView: true
})
export function MapElement(googleMapService, viewIntentService, alertService) {
    this.mapObj = {};
    this.isMapClicked = false;
    this.alertService = alertService;
    this.googleMapService = googleMapService;
    this.viewIntentService = viewIntentService;
    this.$activityParam = viewIntentService.getCurrentIntent().params;
    this.showShareBtn = !this.$activityParam.geoLocation;
    this.mapConfig = {
        nearbyPlaces: false,
        searchBox: null,
        showInfoWindow: !this.showShareBtn,
        styles: {
            height: '95vh'
        }
    };

    if (this.showShareBtn){
        this.mapConfig.searchBox = {
            placeHolder: 'Enter a location',
            styles: []
        }
    }
}

MapElement.prototype.onPlaceSelected = function (event) {
   this.selectedAddress = JSON.parse(JSON.stringify(event));
    if (!this.showShareBtn) {
        this.shareLocation(this.selectedAddress);
    }
}

MapElement.prototype.shareLocation = function(){
    this.viewIntentService.closeIntent(this.selectedAddress);
}
