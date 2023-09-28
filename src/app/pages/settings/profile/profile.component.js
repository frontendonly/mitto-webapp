Element({
    selector: 'mitto-settings-profile',
    DI: ['viewIntent', "GlobalService", "jFlirtDataService", "$actionSheet", "$fileService", 'formControlService'],
    templateUrl: './profile.html'
}, ProfileSettingsComponent);

function ProfileSettingsComponent(viewIntent, _, jFlirtDataService, $actionSheet, $fileService, formControlService) {
    this.didInit = function() {
        var userInfo = viewIntent.getCurrentIntent().params;
        this.imageChanged = false;
        this.editProfileForm = new formControlService({
            username: {
                value: userInfo.username,
                disabled: true
            },
            name: {
                value: userInfo.name,
                validators: {
                    required: true
                }
            },
            description: {
                value: userInfo.description
            },
            gender: {
                value: userInfo.gender,
                validators: {
                    required: true
                }
            },
            mobile: {
                value: userInfo.mobile,
                disabled: true,
                validators: {
                    required: true
                }
            },
            location: {
                value: userInfo.location,
                validators: {
                    required: true
                }
            },
            profileImage: {
                value: userInfo.profileImage
            },
            profileImageUpdate: {
                value: userInfo.profileImageUpdate
            },
            uid: {
                value: userInfo.uid
            }
        });
    }

    this.updateSettings = function() {
        if (!this.editProfileForm.touched || !this.editProfileForm.valid) {
            return;
        }

        jFlirtDataService.updateProfile(this.editProfileForm.value, {
            onSuccess: function() {
                _.$events.$broadcast('profile.on.update');
            },
            onError: function() {
                _.alert("unable to update please try again later.", 1000);
            }
        });
    };

    this.fileSelector = function(type) {
        var _this = this;
        var uid = this.editProfileForm.value.uid;
        _.InitializeCamera(type, function(dataURI) {
            _this.fileUploadProcess = true;
            var _fileName = "profile.jpg";
            $fileService
                .upload({
                    type: "base64",
                    file: dataURI,
                    path: $fileService.getFilePath(uid),
                    fileName: _fileName,
                    sizes: ["100x100"]
                })
                .then(function(file) {
                    _this.fileUploadProcess = false;
                    if (file.result.done) {
                        $fileService
                            .writeFileToDevice({
                                folderPath: $fileService.getFilePath(uid),
                                filePath: file.result.path,
                                file: dataURI,
                                contentType: 'image/jpeg'
                            }, function(response) {
                                _this.patchImageValue($fileService.getFilePath(uid, file.result.path));
                            });
                    } else {
                        _this.fileUploadProcess = false;
                        _.alert("Error uploading your image try again", 1000);
                    }
                }, function() {
                    _this.errorFileUpload();
                });
        });
    };

    this.errorFileUpload = function() {
        console.log(arguments);
    }

    this.openImageMenu = function() {
        var _this = this;
        $actionSheet({
            bottom: true,
            buttonLabels: ['Open image browser', 'Take snapshot', 'Remove image']
        }, function(idx) {
            switch (idx) {
                case (1):
                    _this.fileSelector('SAVEDPHOTOALBUM');
                    break;
                case (2):
                    _this.fileSelector('CAMERA');
                    break;
                case (3):
                    _this.removeImage();
                    break;
            }
        });
    }
}

ProfileSettingsComponent.prototype.patchImageValue = function(value) {
    var lastModified = +new Date;
    this.editProfileForm
        .patchValue({
            profileImage: value,
            profileImageUpdate: lastModified
        });
    this.imageChanged = lastModified;
    this.editProfileForm.markAsTouched();
};

ProfileSettingsComponent.prototype.alertPremium = function() {
    if (!this.isPremiumUser) {
        this.subscription();
    }
};

ProfileSettingsComponent.prototype.removeImage = function() {
    this.patchImageValue("");
};