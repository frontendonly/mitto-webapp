import { RouterModule, ROUTE_INTERCEPTOR, routeConfig } from '@jeli/router';
import { HomeElement } from './pages/home/home.component';
import { LoginElement } from './pages/login/login.component';
import { RouterInterceptorService } from './services/router-interceptor.service';
import { RegisterElement } from './pages/register/register.component';
import { FilterSettingsElement } from './pages/settings/filters/filters.component';
import { CirclesElement } from './pages/circles/circles.component';
import { CheckoutElement } from './pages/checkout/checkout.component';
import { FindFriendsElement } from './pages/find-friends/find.friends.component';
import { ProfileElement } from './pages/profile/profile.component';
import { ProfileSettingsElement } from './pages/settings/profile/profile.component';
import { ManageCoinsElement } from './pages/manage-coins/manage-coins.component';
import { PrivacySettingsElement } from './pages/settings/privacy/privacy.component';
import { BlockedUserElement } from './pages/blocked-user/blocked.users.component';
import { ChangePasswordElement } from './pages/settings/change-password/change-password-component';
import { MessageElement } from './pages/messages/message.component';
import { ChatElement } from './pages/chat/chat.component';
import { MapElement } from './pages/map/map.component';
import { ChangePinElement } from './pages/settings/change-pin/change-pin.component';
import { TheatreComponent } from './pages/theatre/theatre.component';

var routes = [{
    name: 'home',
    url: '/home',
    component: HomeElement,
    targetView: 'content',
    data: {
        authorities: ['ROLE_USER']
    }
},
{
    name: 'login',
    url: '/login',
    fallback: true,
    component: LoginElement,
    targetView: 'content',
    data: {}
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
},
{
    name: 'settings.profile',
    isIntent: true,
    component: ProfileSettingsElement
},
{
    name: 'settings.privacy',
    isIntent: true,
    component: PrivacySettingsElement
},
{
    name: 'settings.password',
    isIntent: true,
    component: ChangePasswordElement
},
{   name: 'settings.changeCoinPin',
    isIntent: true,
    component: ChangePinElement
},
{
    name: 'addFriends',
    isIntent: true,
    component: FindFriendsElement
},
{
    name: 'profile',
    isIntent: true,
    component: ProfileElement
},
{
    name: 'visitors',
    isIntent: true,
    component: CirclesElement,
    data: {
        authorities: ['ROLE_USER'],
        tables: "visitors",
        mapping: "visitor_uid",
        labels: {
            title: "Visitors",
            error: "You have no recent visitors."
        }
    }
},
{
    name: 'likes',
    isIntent: true,
    component: CirclesElement,
    data: {
        authorities: ['ROLE_USER'],
        tables: "circles",
        mapping: "fid",
        labels: {
            title: "Likes",
            error: "You have no recent likes."
        }
    }
},
{
    name: 'match',
    isIntent: true,
    component: CirclesElement,
    data: {
        authorities: ['ROLE_USER'],
        tables: "circles",
        mapping: "fid",
        labels: {
            title: "Match",
            error: "You have no match yet."
        }
    }
},
{
    name: 'interest',
    isIntent: true,
    component: CirclesElement,
    data: {
        authorities: ['ROLE_USER'],
        tables: "circles",
        mapping: "uid",
        labels: {
            title: "Favorites",
            error: "You have no recent interest."
        }
    }
},
{
    name: 'checkout',
    isIntent: true,
    component: CheckoutElement
},
{
    name: 'coins',
    isIntent: true,
    component:ManageCoinsElement
},
{
    name: 'blockedUsers',
    isIntent: true,
    component: BlockedUserElement
},
{
    name:'message',
    isIntent: true,
    component: MessageElement
},
{
    name: 'chat',
    isIntent: true,
    component: ChatElement
},
{
    name: 'map',
    isIntent: true,
    component: MapElement
},
{
    name: 'theatre',
    isIntent: true,
    component: TheatreComponent
}
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