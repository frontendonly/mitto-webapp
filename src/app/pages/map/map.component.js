Element({
    selector: 'mitto-map',
    DI: ["GlobalService", "googleMapService", "viewIntent"],
    templateUrl: './map.html'
}, MapComponent);

function MapComponent(_, googleMapService, viewIntent) {
    var mapObj = {},
        isMapClicked = false;

    this.shareLocation = function() {
        // $model.closeActivity();
    };

    this.searchLocation = function() {
        var _this = this;
        _.openModal({
            content: "Searching...",
            disableCloseBtn: true,
            timeout: 3000
        });

        googleMapService
            .geoCode({ address: this.searchFeild }, function(results, map) {
                mapObj.latLng = results[0].position;
                mapObj.address = this.searchFeild;
                // Add a marker
                googleMapService
                    .setMarker(mapObj);

            }, mapErrorHandler);
    };

    function mapErrorHandler(msg) {
        _.alert(msg || "Error retrieving information", 1000);
    }

    this.didInit = function() {
        this.$activityParam = viewIntent.getCurrentIntent().params;
        this.useFooter = this.$activityParam.useFooter;
        if (this.$activityParam.geoLocation) {
            googleMapService
                .drawGeolocationWithData(document.querySelector('#map_canvas'), this.$activityParam.geoLocation, function(map) {

                }, mapErrorHandler);
        } else {
            setTimeout(function() {
                googleMapService
                    .getCurrentLocation(document.querySelector('#map_canvas'),
                        function(location, map) {
                            var infoWindowMsg = ["Your current location:\n"].join("\n");
                            map.addMarker({
                                'position': location.latLng
                            }, function(marker) {
                                googleMapService
                                    .geoCode({ position: location.latLng }, function(results) {
                                        if (results.length === 0) {
                                            // Not found
                                            return;
                                        }
                                        var address = [
                                            results[0].subThoroughfare || "",
                                            results[0].thoroughfare || "",
                                            results[0].locality || "",
                                            results[0].adminArea || "",
                                            results[0].postalCode || "",
                                            results[0].country || ""
                                        ].join(", ");

                                        mapObj.address = address;
                                        googleMapService
                                            .showMarkerInfo(marker, address);
                                    }, mapErrorHandler);

                                /**
                                 * add event to marker
                                 */
                                marker.on(plugin.google.maps.event.MARKER_CLICK, function() {
                                    locationSelected(location.latLng)
                                });
                                /**
                                 * animate  marker
                                 */
                                map.animateCamera({
                                    target: location.latLng,
                                    zoom: 16
                                }, function() {
                                    marker.showInfoWindow();
                                });
                            });

                            /**
                             * add event
                             */
                            map.on(window.plugin.google.maps.event.MAP_CLICK, locationSelected);

                            function locationSelected(latLng) {
                                mapObj.latLng = latLng;
                                isMapClicked = true;
                                if (!_this.$activityParam.useFooter) {
                                    _this.shareLocation();
                                }
                            }
                        },
                        mapErrorHandler);
            }, 100);
        }
    };

    this.viewDidDestroy = function() {
        // $rootModel.showSidebar = true;
        googleMapService.cleanUp();
        if (isMapClicked) {
            googleMapService.event.broadcast('map.close', [mapObj]);
            googleMapService.event.destroy('map.close');
        }
    };
}