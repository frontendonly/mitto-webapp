import {EventEmitter} from '@jeli/core';
Service({
    name: 'googleMapService'
})
export function GoogleMapService() {
    this.currentMapCanvas = null;
    this.currentMap = null;
    this.event = new EventEmitter();
}

GoogleMapService.prototype.mapIsEnabled = function (mapCanvas) {
    return new Promise((resolve, reject) => {
        if (!(!!window.plugin && !!window.plugin.google)) {
            return reject('Map is unavailable');
        }

        if (mapCanvas) {
            /**
             * trigger the map
             */
            var map = window.plugin.google.maps.Map.getMap(mapCanvas, {
                controls: {
                    compass: true
                }
            });
            this.currentMapCanvas = mapCanvas;
            this.currentMap = map;
            /**
             * initialize map
             */
            this.currentMap.clear();
            map.one(window.plugin.google.maps.event.MAP_READY, resolve);
        } else {
            resolve(window.plugin.google.maps);
        }
    });
}

GoogleMapService.prototype.getCurrentLocation = function (mapCanvas) {
    return new Promise((resolve, reject) => {
        this.mapIsEnabled(mapCanvas)
            .then(() => {
                this.currentMap.getMyLocation(location => {
                    resolve(location)
                }, reject);
            }, reject);
    });
};

GoogleMapService.prototype.geoCode = function (options) {
    return new Promise((resolve, reject) => {
        this.mapIsEnabled()
            .then(function (googleMapsPlugin) {
                googleMapsPlugin
                    .Geocoder.geocode(options, function (results) {
                        if (results.length) {
                            return resolve(results);
                        }
                        reject();
                    });
            }, reject);
    });
};

GoogleMapService.prototype.showMarkerInfo = function (marker, address) {
    marker.setTitle(address).showInfoWindow();
};

GoogleMapService.prototype.getMap = function () {
    return this.currentMap;
};

GoogleMapService.prototype.cleanUp = function () {
    this.currentMapCanvas = null;
    this.currentMap = null;
};

GoogleMapService.prototype.setMarker = function (geoData) {
    this.currentMap.addMarker({
        'position': geoData.latLng,
        'title': geoData.address
    }, (marker) => {
        // Move to the position
        this.currentMap.animateCamera({
            'target': geoData.latLng,
            'zoom': 17
        }, function () {
            marker.showInfoWindow();
        });
    });
};

GoogleMapService.prototype.drawGeolocationWithData = function (mapCanvas, geoData) {
    return this.mapIsEnabled(mapCanvas)
        .then(() => {
            // Add a marker
            this.setMarker(geoData);
        });
};