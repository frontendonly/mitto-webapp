import {ViewIntentService} from '@jeli/router';
import { DataService } from "../../services/data.service";
import { ConfigService } from "../../services/config.service";
import {FormControlService} from '@jeli/form';
import {FoAuthService} from '@jeli/materials';

Element({
    selector: 'mitto-register',
    templateUrl: './register.html',
    DI: [
        ViewIntentService,
        DataService,
        ConfigService,
        FoAuthService,
        'changeDetector?'
    ]
})
export function RegisterElement(viewIntent, dataService, configService, foAuthService, changeDetector) {
    this.viewIntent = viewIntent;
    this.dataService = dataService;
    this.configService = configService;
    this.foAuthService = foAuthService;
    this.changeDetector = changeDetector;
    this.currentStep = 0;
    this.postData = {
        data: {}
    };
    this.error = {
        username: false
    };
    this.isValidatingEmail = false;
    this.emailExist = false;
    this.isSubmitting = false;

    this.datePicker = {
        month: []
    };

    this.registerForm = new FormControlService({
        name: {
            validators: {
                minlength: 3
            }
        },
        mobile: {
            validators: {
                minlength: 9,
                maxlength: 15
            }
        },
        username: {
            validators: {
                required: true,
                minlength: 3,
                async: (username) => {
                    return this.dataService.isUserNameExists(username)
                }
            }
        },
        gender: {
            value: 1,
            validators: {
                minlength: 1
            }
        },
        optMonth: {
            value: 8,
            validators: {
                minlength: 1
            }
        },
        optDay: {
            value: 12,
            validators: {
                minlength: 2
            }
        },
        optYear: {
            value: 1987,
            validators: {
                minlength: 4
            }
        }
    });
}

RegisterElement.prototype.register = function() {
    this.emailExist = false;
    this.isSubmitting = true;
    var formValue = this.registerForm.value;
    var data = createUserInfoStructure({
        username: data.username,
        name: formValue.name,
        mobile: String(formValue.mobile),
        gender: formValue.gender,
        age: this.dataService.getAge(formValue.optYear),
        interested: [],
        searchFilter: {
            interested: formValue.gender ? 0 : 1,
            onlineUsers: false,
            hasProfilePic: false,
            minAge: 18,
            maxAge: 50,
            maxKm: 20,
            minKm: 0
        },
        uid: this.foAuthService.userId
    });

    this.dataService.storeUserInfo(data, () => {
        this.configService.updateConfiguration({
            config: {
                userData: {
                    name: data.name,
                    userId: data.uid,
                    mobile: data.mobile,
                    username: data.username
                },
                signedIn: true,
                lastLoginTime: +new Date,
                authorities: ['ROLE_USER']
            }
        });
        this.viewIntent.destroyAllIntent();
    });
}

RegisterElement.prototype.errorField = function(fieldName, validklass, inValidKlass) {
    return this.registerForm.error[fieldName] ? inValidKlass : validklass;
}