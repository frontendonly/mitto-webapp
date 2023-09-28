Service({
    name: 'googleMapService'
}, googleMapServiceFn);


function googleMapServiceFn() {
    var _current_map_canvas_ = null,
        _current_map_ = null;

    this.mapIsEnabled = function(fn, error) {
        if (!(!!window.plugin && !!window.plugin.google)) {
            return (error || function() {})('Map is unavailable');
        }

        /**
         * trigger the map
         */
        fn(window.plugin.google.maps);
    };

    function privateMapApi(mapCanvas, googleMapsPlugin, fn) {
        var map = googleMapsPlugin.Map.getMap(mapCanvas, {
            controls: {
                compass: true
            }
        });
        _current_map_canvas_ = mapCanvas;
        _current_map_ = map;
        /**
         * initialize map
         */
        map.one(googleMapsPlugin.event.MAP_READY, fn);
    }

    this.getCurrentLocation = function(mapCanvas, success, error) {
        this.mapIsEnabled(function(googleMapsPlugin) {
            privateMapApi(mapCanvas, googleMapsPlugin, function() {
                _current_map_.clear();
                _current_map_.getMyLocation(function(location) {
                    success(location, _current_map_)
                }, function(msg) {
                    error(msg, msg);
                });
            });

        }, error);

    };

    /**
     * 
     * @param {*} results 
     * @param {*} success 
     * @param {*} error 
     */
    function geoCodeHandler(results, success, error) {
        if (results.length) {
            success(results, _current_map_);
            return;
        }

        (error || noop)();
    }


    this.geoCode = function(options, success, error) {
        this.mapIsEnabled(function(googleMapsPlugin) {
            googleMapsPlugin
                .Geocoder.geocode(options, function(results) {
                    geoCodeHandler(results, success, error);
                });
        }, error);
    };

    this.showMarkerInfo = function(marker, address) {
        marker.setTitle(address)
            .showInfoWindow();
    };

    this.getMap = function() {
        return _current_map_;
    };

    this.cleanUp = function() {
        _current_map_canvas_ = _current_map_ = null;
    };

    this.setMarker = function(geoData) {
        _current_map_.addMarker({
            'position': geoData.latLng,
            'title': geoData.address
        }, function(marker) {
            // Move to the position
            _current_map_.animateCamera({
                'target': geoData.latLng,
                'zoom': 17
            }, function() {
                marker.showInfoWindow();
            });
        });
    };

    this.drawGeolocationWithData = function(mapCanvas, geoData, success, error) {
        var self = this;
        this.mapIsEnabled(function(googleMapsPlugin) {
            privateMapApi(mapCanvas, googleMapsPlugin, function() {
                _current_map_.clear();
                // Add a marker
                self.setMarker(geoData);
                success(_current_map_);
            });
        }, error);
    };

    this.event = {
        _event_: {},
        $on: function(name, fn) {
            this._event_[name] = fn;
        },
        broadcast: function(name, arg) {
            if (!this._event_[name]) {
                return;
            }

            this._event_[name].apply(this, arg);
        },
        destroy: function(name) {
            this._event_[name] = null;
        }
    }

    return this;
}