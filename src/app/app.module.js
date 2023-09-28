import {CommonModule} from '@jeli/common';
import {FormModule} from '@jeli/form';
import {FoAuthModule, FoCommonModule, AUTH_DATABASE_SERIVCE, GoogleMapModule} from '@jeli/materials';
import {MittoElement} from './app.element.js';
import {MittoRouterModule} from './app.router.js';
import { NavBarElement } from './components/nav-bar/nav-bar.component.js';
import { AppMenuElement } from './components/appMenu/appmenu.components.js';
import { SplashScreenElement } from './pages/splash-screen/splash-screen.component.js';
import { HomeElement } from './pages/home/home.component.js';
import { ImageResolverDirective } from './components/img.resolver.directive.js';
import { LoginElement } from './pages/login/login.component.js';
import { DatabaseService } from './services/database.service.js';
import { environment } from '../environments/env.js';
import { ModalComponent } from './components/modal/modal.component.js';
import { RegisterElement } from './pages/register/register.component.js';
import { ActivityNavBarElement } from './components/activity-bar/activity.navbar.component.js';
import { FilterSettingsElement } from './pages/settings/filters/filters.component.js';


jModule({
    requiredModules:[
        CommonModule,
        FormModule,
        MittoRouterModule,
        FoAuthModule,
        FoCommonModule,
        GoogleMapModule.setKey('AIzaSyDOq9tQP8alNkvxRyRaolwMBz8JvYp9ln8', true)
    ],
	selectors: [
		MittoElement,
        SplashScreenElement,
        HomeElement,
        NavBarElement,
        AppMenuElement,
        LoginElement,
        ImageResolverDirective,
        ModalComponent,
        RegisterElement,
        ActivityNavBarElement,
        FilterSettingsElement
	],
    services: [
        {
            name: AUTH_DATABASE_SERIVCE,
            useClass: DatabaseService
        }
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