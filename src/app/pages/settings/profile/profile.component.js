import { ViewIntentService } from '@jeli/router';
import { FormControlService } from '@jeli/form';
import { DataService } from '../../../services/data.service';
import { ActionSheet } from '../../../services/actionsheet';
import { FileUploaderService } from '../../../services/file.service';
import { globalEvents } from '../../../services/utils';

Element({
    selector: 'mitto-settings-profile',
    DI: [ViewIntentService, DataService, ActionSheet, FileUploaderService],
    templateUrl: './profile.html',
    exposeView: true
})
export function ProfileSettingsElement(viewIntent, dataService, actionSheet, fileService) {
    this.userInfo = viewIntent.getCurrentIntent().params;
    this.dataService = dataService;
    this.actionSheet = actionSheet;
    this.fileService = fileService;
    this.imageChanged = false;
    this.editProfileForm = new FormControlService({
        username: {
            value: this.userInfo.username,
            disabled: true
        },
        name: {
            value: this.userInfo.name,
            validators: {
                required: true
            }
        },
        description: {
            value: this.userInfo.description
        },
        gender: {
            value: this.userInfo.gender,
            validators: {
                required: true
            }
        },
        mobile: {
            value: this.userInfo.mobile,
            disabled: true,
            validators: {
                required: true
            }
        },
        location: {
            value: this.userInfo.location,
            validators: {
                required: true
            }
        },
        profileImage: {
            value: this.userInfo.profileImage
        },
        profileImageUpdate: {
            value: this.userInfo.profileImageUpdate
        },
        uid: {
            value: this.userInfo.uid
        }
    });
}

ProfileSettingsElement.prototype.updateSettings = function () {
    if (!this.editProfileForm.touched || !this.editProfileForm.valid) {
        return;
    }

    this.dataService.updateProfile(this.editProfileForm.value).then(() => {
        globalEvents.dispatch('profile.on.update');
    });
};

ProfileSettingsElement.prototype.fileSelector = function (type) {
    var uid = this.editProfileForm.value.uid;
    this.fileService.filePicker(type)
        .then(file => {
            this.fileUploadProcess = true;
            this.fileService
                .upload({
                    file: file.dataUri,
                    path: this.fileService.getFilePath(uid),
                    fileName: 'profile.' + file.mimeType,
                    sizes: ['100x100'],
                    replaceIfExists: true
                }, true)
                .then((res) => {
                    this.fileUploadProcess = false;
                    this.patchImageValue(this.fileService.getFilePath(uid, res.files[0].name));
                }, (err) => this.errorFileUpload(err));
        });
};

ProfileSettingsElement.prototype.errorFileUpload = function () {
    console.log(arguments);
}

ProfileSettingsElement.prototype.openImageMenu = function () {
    var actions = {
        1: () => this.fileSelector('SAVEDPHOTOALBUM'),
        2: () => this.fileSelector('CAMERA'),
        3: () => this.removeImage()
    };

    this.actionSheet({
        bottom: true,
        buttonLabels: ['Open image browser', 'Take snapshot', 'Remove image']
    }, idx => actions[idx]());
}

ProfileSettingsElement.prototype.patchImageValue = function (value) {
    var lastModified = +new Date;
    this.editProfileForm
        .patchValue({
            profileImage: value,
            profileImageUpdate: lastModified
        });
    this.imageChanged = lastModified;
    this.editProfileForm.markAsTouched();
};

ProfileSettingsElement.prototype.alertPremium = function () {
    if (!this.isPremiumUser) {
        this.subscription();
    }
};

ProfileSettingsElement.prototype.removeImage = function () {
    this.patchImageValue("");
};