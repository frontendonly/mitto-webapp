Service({
    name: 'Conf',
    DI: ['$http', '$promise']
}, ConfigurationFn);


function ConfigurationFn($http, $promise) {

    var service = {
        isLoaded: isLoaded,
        smileyLoaded: false,
        getConfig: getConfig,
        getSmileyConfig: getSmileyConfig,
        init: init
    };

    var _config;
    var _smiley = {
        others: [],
        emotions: [],
        love: []
    };

    return service;

    function isLoaded() {
        return $isDefined(_config);
    }

    function getConfig() {
        if (!_config) {
            _config = $http.get('cms/flirtzone.config.json');
        }

        return _config;
    }

    function init() {
        this.getConfig();
        this.getSmileyConfig();
    }

    function getSmileyConfig() {
        var promise = new $promise();

        if (service.smileyLoaded) {
            promise.resolve(_smiley);
            return promise;
        }

        $http.get('cms/assets.json')
            .then(function(res) {
                service.smileyLoaded = true;
                res.forEach(function(item) {
                    if (item.type === "file") {
                        if (item.depth === 2) {
                            _smiley['others'].push(item.location);
                        }

                        ["emotions", "love"].forEach(function(group) {
                            if (item.location.indexOf(group) > -1 && item.depth === 3) {
                                _smiley[group].push(item.location)
                            }
                        });
                    }
                });

                promise.resolve(_smiley);
            });

        return promise;
    }
}