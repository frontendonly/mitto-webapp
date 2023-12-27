import { DatabaseService } from "./database.service";
import { UploadService, base64ToFile, blobURL } from '@jeli/materials';
import { noop } from "./utils";

Service({
    DI: [DatabaseService, UploadService]
})
export function FileUploaderService(databaseService, uploadService) {
    this.databaseService = databaseService;
    this.uploadService = uploadService;
    this.fileCache = !window.cordova ? {} : null;
}

/**
 * 
 * @param {*} options 
 */
FileUploaderService.prototype.upload = function (options, saveImage) {
    return this.uploadService.upload(options)
        .then(res => {
            if (saveImage && res.result.files) {
                this.writeFileToDevice({
                    folderPath: options.path,
                    filePath: res.result.files[0].name,
                    file: options.file,
                    contentType: 'image/jpeg'
                }, this.errorMsg('writeToDevice:', true));
            }

            return res.result;
        });
}

/**
 * 
 * @param {*} options 
 * @param {*} writable 
 */
FileUploaderService.prototype.getFile = function (options, writable) {
    return this.uploadService.getFile(options);
}

/**
 * 
 * @param {*} path 
 * @param {*} handlers 
 */
FileUploaderService.prototype.getImageFromDB = function (path, handlers) {
    this.databaseService.core.jQl('select -image -_uploads_ -where(img= ' + path + ')', handlers);
}

/**
 * 
 * @param {*} $id 
 * @param {*} path 
 */
FileUploaderService.prototype.getFilePath = function (id, path) {
    return this.uploadService.getPath(id, 'images', path || '');
}

/**
 * 
 * @param {*} filePath 
 */
FileUploaderService.prototype.getNativePath = function (filePath) {
    return (window.cordova ? cordova.file.dataDirectory : "") + (filePath || "");
}

/**
 * 
 * @param {*} base64 
 * @param {*} mimeType 
 */
FileUploaderService.prototype.toURL = function (base64, mimeType) {
    return blobURL(base64, mimeType);
}

FileUploaderService.prototype.errorMsg = function (msg, ret) {
    var log = function (err) {
        console.log(ret, err);
    };

    return ret ? log : log(msg);
}

/**
 * 
 * @param {*} options 
 * @param {*} CB 
 */
FileUploaderService.prototype.writeFileToDevice = function (options, CB) {
    if (!window.cordova) {
        /**
         * store and reference the cached file
         */
        if (this.fileCache) {
            this.fileCache[options.folderPath + options.fileName] = options.file;
        }

        return CB({ success: -1 });
    }

    this.createFolder(options.folderPath, (cPath) => {
        window.resolveLocalFileSystemURL(this.getNativePath(cPath), (dir) => {
            this.errorMsg("Access to the directory granted succesfully");
            dir.getFile(options.fileName, { create: true, exclusive: false }, (file) => {
                this.errorMsg("File created succesfully.");
                file.createWriter((fileWriter) => {
                    this.errorMsg("Writing content to file");
                    fileWriter.write(base64ToFile(options.file, options.contentType));
                    CB({ success: 1 });
                }, function () {
                    CB({ message: 'Unable to save file in path ' + options.folderPath, success: 0 });
                });
            }, errorMsg("Unable to create file", true));
        }, errorMsg('path not found ' + getNativePath(cPath), true));
    });
}

/**
 * 
 * @param {*} folderPath 
 * @param {*} CB 
 */
FileUploaderService.prototype.createFolder = function (folderPath, CB) {
    window.resolveLocalFileSystemURL(getNativePath(), (directoryEntry) => {
        var spltFolder = folderPath.split('/'),
            previous = "",
            _count = 0;

        spltFolder
            .map((folderName, idx) => {
                if (!folderName) { _count++; return; }
                previous = [previous, folderName].join("/");
                directoryEntry.getDirectory(previous, { create: true, exclusive: false }, () => {
                    _count++;
                    if (_count === spltFolder.length - 1) {
                        (CB || noop)(previous, arguments);
                    }
                }, this.errorMsg('Failed to create folder:', previous));
            });
    }, this.errorMsg('Failed to open file system'));
}

/**
 * 
 * @param {*} filePath 
 */
FileUploaderService.prototype.fileExists = function (filePath) {
    return new Promise((resolve, reject) => {
        if (!window.cordova) {
            reject();
            return;
        }
        window.resolveLocalFileSystemURL(getNativePath(), (fileSystem) => {
            fileSystem.getFile(filePath, { create: false, exclusive: false }, resolve, reject)
        }, reject);
    });
}

/**
 * 
 * @param {*} filePath 
 * @param {*} CB 
 * @param {*} fCB 
 * @param {*} lastModified 
 * @param {*} forceDownload 
 */
FileUploaderService.prototype.download = function (filePath, CB, fCB, lastModified, forceDownload) {
    CB = CB || noop;
    var doDownload = () => {
        /**
         * available for use only on desktop
         */
        if (this.fileCache && this.fileCache[filePath] && !forceDownload) {
            return CB(blobURL(this.fileCache[filePath]));
        }

        this.getFile({ type: 'base64', filePath: filePath })
            .then(res => {
                if (res.result.size) {
                    CB(blobURL(res.result.file, res.result.mimeType));
                    var fileSplit = filePath.split('/'),
                        fileName = fileSplit.pop();
                    this.writeFileToDevice({
                        folderPath: fileSplit.join('/'),
                        fileName: fileName,
                        file: res.result.file.split(',')[1],
                        contentType: res.result.mimeType
                    }, this.errorMsg("Write to file failed", true));
                }
            }, fCB || noop);
    };

    if (!forceDownload) {
        this.fileExists(filePath).then((fileEntry) => {
            if (lastModified && lastModified > new Date(fileEntry.lastModifiedDate)) {
                doDownload();
                return;
            }

            CB(fileEntry.toURL());
        }, doDownload);
    } else {
        doDownload();
    }
}

/**
 * 
 * @param {*} filePath 
 * @param {*} CB 
 */
FileUploaderService.prototype.removeFile = function (filePath) {
    this.fileExists(filePath).then((fileEntry) => {
        fileEntry.remove();
    }, this.errorMsg('Unable to remove file', true));
}

/**
 * 
 * @param {*} filePath 
 * @param {*} CBS 
 * @param {*} CBF 
 */
FileUploaderService.prototype.saveImageToGallery = function (filePath) {
    return new Promise((resolve, reject) => {
        this.fileExists(filePath).then((fileEntry) => {
            cordova.plugins.imagesaver.saveImageToGallery(fileEntry.toURL(), resolve, reject);
        }, reject);
    })
}

FileUploaderService.prototype.filePicker = function (type) {
    var camPlugin = navigator['camera'];
    return new Promise((resolve, reject) => {
        if (camPlugin) {
            /**
             * initialize the camera
             */
            camPlugin.getPicture(dataUrI => resolve({ dataUri: 'data:image/jpeg;base64,' + dataUrI, mimeType: 'jpeg' }), reject, {
                quality: 100,
                destinationType: Camera.DestinationType.DATA_URL,
                sourceType: Camera.PictureSourceType[type],
                encodingType: Camera.EncodingType.JPEG,
                mediaType: Camera.MediaType.PICTURE,
                targetWidth: 720,
                targetHeight: 540,
                saveToPhotoAlbum: false,
                allowEdit: false,
                correctOrientation: true //Corrects Android orientation quirks
            });
        } else {
            this.uploadService.htmlFilePicker(false, null, processed => {
                var file = processed.readyForUpload[0];
                var reader = new FileReader();
                var mimeType = file.name.substr(file.name.lastIndexOf('.') + 1);
                // Read file into memory as UTF-8      
                reader.readAsDataURL(file);
                // Handle errors load
                reader.onload = b4file => resolve({ dataUri: b4file.target.result, mimeType });
                reader.onerror = reject;
            }, true);
        }
    })
}