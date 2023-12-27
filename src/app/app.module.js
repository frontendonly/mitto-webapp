import { CommonModule } from '@jeli/common';
import { FormModule } from '@jeli/form';
import { FoAuthModule, FoCommonModule, AUTH_DATABASE_SERIVCE, GoogleMapModule, FoPaymentMethodsModule, FoCommonDirectivesModule } from '@jeli/materials';
import { MittoElement } from './app.element.js';
import { MittoRouterModule } from './app.router.js';
import { NavBarElement } from './components/nav-bar/nav-bar.component.js';
import { AppMenuElement } from './components/appMenu/appmenu.components.js';
import { SplashScreenElement } from './pages/splash-screen/splash-screen.component.js';
import { HomeElement } from './pages/home/home.component.js';
import { ImageResolverDirective } from './components/img.resolver.directive.js';
import { LoginElement } from './pages/login/login.component.js';
import { DatabaseService } from './services/database.service.js';
import { environment } from '../environments/env.js';
import { RegisterElement } from './pages/register/register.component.js';
import { ActivityNavBarElement } from './components/activity-bar/activity.navbar.component.js';
import { FilterSettingsElement } from './pages/settings/filters/filters.component.js';
import { CardBoxElement } from './components/card-box/card-box.element.js';
import { SwipeEventRegistry } from './components/swipe-registry.js';
import { CirclesElement } from './pages/circles/circles.component.js';
import { FilterBoxDirective } from './components/filter.box.component.js';
import { CurrencyService } from './services/money.js';
import { MittoScubsriptionElement } from './components/subscription/subscription.component.js';
import { MoneyFilterService } from './services/money.pipe.js';
import { SubscriptionBarElement } from './components/subscription/subcription-bar.component.js';
import { CheckoutElement } from './pages/checkout/checkout.component.js';
import { FindFriendsElement } from './pages/find-friends/find.friends.component.js';
import { ProfileElement } from './pages/profile/profile.component.js';
import { ProfileSettingsElement } from './pages/settings/profile/profile.component.js';
import { ManageCoinsElement } from './pages/manage-coins/manage-coins.component.js';
import { PrivacySettingsElement } from './pages/settings/privacy/privacy.component.js';
import { BlockedUserElement } from './pages/blocked-user/blocked.users.component.js';
import { ChangePasswordElement } from './pages/settings/change-password/change-password-component.js';
import { ReportUserModalElement } from './components/report-user/report-user.component.js';
import { MessageElement } from './pages/messages/message.component.js';
import { ChatElement } from './pages/chat/chat.component.js';
import { ChatIconsElement } from './pages/chat/chat-icons.js';
import { ChatContainerDirective } from './pages/chat/chat-container.js';
import { ChatTextAreaDirective } from './pages/chat/chat-textarea.js';
import { MapElement } from './pages/map/map.component.js';
import { ChangePinElement } from './pages/settings/change-pin/change-pin.component.js';
import { TheatreComponent } from './pages/theatre/theatre.component.js';


jModule({
    requiredModules: [
        CommonModule,
        FormModule,
        MittoRouterModule,
        FoPaymentMethodsModule,
        FoAuthModule,
        FoCommonModule,
        FoCommonDirectivesModule,
        GoogleMapModule.setKey('AIzaSyDOq9tQP8alNkvxRyRaolwMBz8JvYp9ln8')
    ],
    selectors: [
        MittoElement,
        SplashScreenElement,
        HomeElement,
        NavBarElement,
        AppMenuElement,
        LoginElement,
        ImageResolverDirective,
        RegisterElement,
        ActivityNavBarElement,
        FilterSettingsElement,
        CardBoxElement,
        SwipeEventRegistry,
        CirclesElement,
        FilterBoxDirective,
        SubscriptionBarElement,
        MittoScubsriptionElement,
        CheckoutElement,
        FindFriendsElement,
        ProfileElement,
        ProfileSettingsElement,
        ManageCoinsElement,
        PrivacySettingsElement,
        BlockedUserElement,
        ChangePasswordElement,
        ReportUserModalElement,
        MessageElement,
        ChatElement,
        ChatIconsElement,
        ChatContainerDirective,
        ChatTextAreaDirective,
        MapElement,
        ChangePinElement,
        TheatreComponent
    ],
    services: [
        {
            name: AUTH_DATABASE_SERIVCE,
            useClass: DatabaseService
        },
        CurrencyService,
        MoneyFilterService
    ],
    rootElement: MittoElement
})
export function MittoModule() {
    FoAuthModule.setConfig({
        name: environment.name,
        organisation: environment.space,
        pageAfterLogin: 'home',
        passwordResetPage: 'login',
        redirectOnPages: ['login'],
        loginPage: 'login'
    });
}