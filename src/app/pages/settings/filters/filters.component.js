import { appConfiguration } from "../../../services/app-configuration";
import { DataService } from "../../../services/data.service";
import {FormControlService} from '@jeli/form';
import {ViewIntentService} from '@jeli/router';
import { globalEvents } from "../../../services/utils";

Element({
    selector: 'mitto-settings-filters',
    DI: [
        DataService,
        ViewIntentService
    ],
    templateUrl: './filters.html',
    style: '.collection{ border-radius: 0px; border-right: none; border-left: none; margin: 0 -0.75rem}',
    exposeView: true
})
export function FilterSettingsElement(dataService, viewIntentService) {
    this.appConfig = appConfiguration;
    this.dataService = dataService;
    this.userInfo = viewIntentService.getCurrentIntent().params;
    this.filterForm = new FormControlService({
        searchFilter: new FormControlService({
            interested: {
                validators: {
                    required: true
                }
            },
            onlineUsers: {
                validators: {
                    required: true
                }
            },
            hasProfilePic: {
                validators: {
                    required: true
                }
            },
            minAge: {
                validators: {
                    required: true
                }
            },
            maxAge: {
                validators: {
                    required: true
                }
            },
            maxKm: {
                validators: {
                    required: true
                }
            },
        }),
        style: {
            validators: {
                required: true
            }
        }
    });
}

FilterSettingsElement.prototype.didInit = function() {
    this.filterForm.patchValue(this.userInfo);
}

FilterSettingsElement.prototype.selectInterested = function(val) {
    this.filterForm.getField('searchFilter').patchValue({
        interested: val
    });
};

FilterSettingsElement.prototype.setStyle = function(style) {
    this.filterForm.getField('style').patchValue(style);
};

FilterSettingsElement.prototype.saveSettings = function() {
    if (!this.filterForm.touched) return;
    Object.assign(this.userInfo, this.filterForm.value);
    this.dataService.updateProfile(Object.assign({ uid: this.userInfo.uid}, this.filterForm.value))
    .then(() => globalEvents.dispatch('settings.filter', this.filterForm.value));
};