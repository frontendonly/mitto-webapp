Service({
    name: 'webServiceInterceptor',
    DI: ["GlobalService", "appEvent"]
}, webServiceInterceptor);

function webServiceInterceptor(gs, appEvent) {
    this.responseError = function(response) {
        if ($inArray(response.status, [401, 400]) && this.isEnabled(response.path)) {
            if (response.data && response.data.message) {
                gs.alert(response.data.message);
            }
        }

        appEvent.httpInProgress = false;
        return response;
    }

    this.request = function(req) {
        appEvent.httpInProgress = this.isEnabled(req.url);
        return req;
    }

    this.responseSuccess = function(res) {
        appEvent.httpInProgress = false;
        return res;
    };
}

webServiceInterceptor.prototype.isEnabled = function(url) {
    return ['/user/authorize',
        '/user/reauthorize',
        '/database/updates',
        '/send/email',
        '/user/register',
        '/database/push',
        'user/exists',
        'application/api'
    ].some(function(key) {
        return $inArray(key, url);
    });
};