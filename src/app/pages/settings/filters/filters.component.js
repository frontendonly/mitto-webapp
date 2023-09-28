import { appConfiguration } from "../../../services/app-configuration";
import { DataService } from "../../../services/data.service";
import {FormControlService} from '@jeli/form';

Element({
    selector: 'mitto-settings-filters',
    DI: [
        DataService,
        'changeDetector?'
    ],
    templateUrl: './filters.html',
    style: '.collection{ border-radius: 0px; border-right: none; border-left: none; margin: 0 -0.75rem}',
    exposeView: true
})
export function FilterSettingsElement(dataService) {
    this.appConfig = appConfiguration;
    this.dataService = dataService;
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
    this.dataService
        .getCurrentUserInfo()
        .then(userInfo  => {
            this.userInfo = userInfo;
            this.filterForm.patchValue({
                searchFilter: userInfo.searchFilter,
                style: userInfo.style
            });
        });
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
    var value = this.filterForm.value;
    value.uid = this.userInfo.uid;
    this.dataService.updateProfile(value, 'settings.filter')
    .catch(() => {
        this.errorMessage = "unable to update please try again later.";
    });
};