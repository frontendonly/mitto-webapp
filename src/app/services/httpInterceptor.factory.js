import { httpInProgress } from "./utils";

Service({
    DI: []
})
export function GlobalHttpInterceptor() {
    this.resolve = function (request, next) {
        this.requestState(request.url);
        next(request)
            .subscribe(response => this.responseState(response), response => this.responseState(response));
    };

    this.requestState = function (url) {
        if (isEnabled(url)) {
            httpInProgress.emit(true);
        }
    };

    this.responseState = function (response) {
        httpInProgress.emit(false);
        if ([401, 400, 403].includes(response.status) && isEnabled(response.path)) {
            if (response.data && response.data.message) {
               // alertService.alert(response.data.message);
            }
        }
        return response;
    };


    function isEnabled(url) {
        return ![
            '/user/authorize',
            '/user/reauthorize',
            '/database/updates',
            '/send/email',
            '/user/register',
            '/database/push',
            'user/exists',
        ].some((key) => url.includes(key));
    }
}