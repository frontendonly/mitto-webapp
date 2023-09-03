import { RouterModule } from '@jeli/router';

jModule({
    requiredModules: [
        RouterModule
    ]
})
export function MittoRouterModule() {
    var routes = [];
    RouterModule.setRoutes(routes);
}