import { LocationService, ROUTE_EVENT_ENUMS } from '@jeli/router';

Service({
    DI: [LocationService]
})
export function RouterInterceptorService( locationService) {
    locationService.events.add(ROUTE_EVENT_ENUMS.SUCCESS, routeHandler);
    function routeHandler(event, route) {
        if (route.data && route.data.pageTitle) {
            document.title = getPageTitle(route.data.pageTitle);
        }
    }
}

RouterInterceptorService.prototype.resolve = function(route, next) {
    next();
}