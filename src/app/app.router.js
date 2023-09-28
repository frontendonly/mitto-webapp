import { RouterModule, ROUTE_INTERCEPTOR, routeConfig } from '@jeli/router';
import { HomeElement } from './pages/home/home.component';
import { LoginElement } from './pages/login/login.component';
import { RouterInterceptorService } from './services/router-interceptor.service';
import { RegisterElement } from './pages/register/register.component';
import { FilterSettingsElement } from './pages/settings/filters/filters.component';

var routes = [{
    name: 'home',
    url: '/home',
    component: HomeElement,
    fallback: true,
    targetView: 'content',
    data: {
        authorities: ['ROLE_USER']
    }
},
{
    name: 'login',
    url: '/login',
    component: LoginElement,
    targetView: 'content',
    data: {
        authorities: []
    }
}, {
    name: 'register',
    isIntent: true,
    component: RegisterElement,
    targetView: 'content',
    data: {}
},
{
    name: 'settings.filters',
    isIntent: true,
    component: FilterSettingsElement
}
    // , {
    //     name: 'visitors',
    //     isIntent: true,
    //     view: {
    //         component: 'mitto-circles'
    //     },
    //     data: {
    //         authorities: ['ROLE_USER'],
    //         tables: "visitors",
    //         mapping: "visitor_uid",
    //         labels: {
    //             title: "Visitors",
    //             error: "You have no recent visitors."
    //         }
    //     },
    // }
];

jModule({
    requiredModules: [
        RouterModule.setRoutes(routes)
    ],
    services: [{
        name: ROUTE_INTERCEPTOR,
        useClass: RouterInterceptorService
    }]
})
export function MittoRouterModule() {
    routeConfig.restoreOnRefresh = false;
    routeConfig.autoInitialize = false;
}