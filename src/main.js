import { bootStrapApplication } from '@jeli/core';
import { MittoModule } from './app/app.module';

bootStrapApplication(MittoModule, function() {
    console.log('Mitto initialized');
});