import {CommonModule} from '@jeli/common';
import {MittoElement} from './app.element.js';
import {MittoRouterModule} from './app.router.js';

jModule({
    requiredModules:[
        CommonModule,
        MittoRouterModule
    ],
	selectors: [
		MittoElement,
	],
	rootElement: MittoElement
})
export function MittoModule() { }