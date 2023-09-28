import { DatabaseService } from "./database.service";
import { noop } from "./utils";

Service({
    DI: [DatabaseService]
})
export function FileUploaderService(databaseService) {
    this.databaseService = databaseService;
    this.fileCache = !window.cordova ? {} : null;
}

/**
 * 
 * @param {*} options 
 */
FileUploaderService.prototype.upload = function(options) {
    return this.databaseService.core.api('/file/attachment', options);
}

/**
 * 
 * @param {*} options 
 * @param {*} writable 
 */
FileUploaderService.prototype.getFile = function(options, writable) {
    return this.databaseService.core.api('/attachment', options);
}

/**
 * 
 * @param {*} path 
 * @param {*} handlers 
 */
FileUploaderService.prototype.getImageFromDB = function(path, handlers) {
    this.databaseService.core.jQl('select -image -_uploads_ -where(img= ' + path + ')', handlers);
}

/**
 * 
 * @param {*} $id 
 * @param {*} path 
 */
FileUploaderService.prototype.getFilePath = function (id, path) {
    return [id, "/images/", path || ""].join('');
}

/**
 * 
 * @param {*} filePath 
 */
FileUploaderService.prototype.getNativePath = function(filePath) {
    return (window.cordova ? cordova.file.dataDirectory : "") + (filePath || "");
}

/**
 * 
 * @param {*} b64Data 
 * @param {*} contentType 
 * @param {*} sliceSize 
 */
FileUploaderService.prototype.b64toBlob =  function(b64Data, contentType, sliceSize) {
    contentType = contentType || '';
    sliceSize = sliceSize || 512;

    var byteCharacters = atob(b64Data);
    var byteArrays = [];

    for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
        var slice = byteCharacters.slice(offset, offset + sliceSize);

        var byteNumbers = new Array(slice.length);
        for (var i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
        }

        var byteArray = new Uint8Array(byteNumbers);

        byteArrays.push(byteArray);
    }

    return new Blob(byteArrays, { type: contentType });
}

/**
 * 
 * @param {*} base64 
 * @param {*} mimeType 
 */
FileUploaderService.prototype.toURL = function(base64, mimeType) {
    var blob;
    try {
        blob = URL.createObjectURL(this.b64toBlob(base64.split(',')[1], mimeType));
    } catch (e) {
        blob = base64;
    }

    return blob;
}

FileUploaderService.prototype.errorMsg = function(msg, ret) {
    var log = function(err) {
        console.log(ret, err);
    };

    return ret ? log : log(msg);
}

/**
 * 
 * @param {*} options 
 * @param {*} CB 
 */
FileUploaderService.prototype.writeFileToDevice = function(options, CB) {
    if (!window.cordova) return CB({ success: -1 });

    this.createFolder(options.folderPath, (cPath) => {
        window.resolveLocalFileSystemURL(this.getNativePath(cPath), (dir) => {
            this.errorMsg("Access to the directory granted succesfully");
            dir.getFile(options.fileName, { create: true, exclusive: false }, (file) => {
                this.errorMsg("File created succesfully.");
                file.createWriter((fileWriter)  => {
                    this.errorMsg("Writing content to file");
                    fileWriter.write(this.b64toBlob(options.file, options.contentType));
                    CB({ success: 1 });
                }, function() {
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
FileUploaderService.prototype.createFolder = function(folderPath, CB) {
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
FileUploaderService.prototype.fileExists = function(filePath) {
    return new  Promise((resolve, reject) => {
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
FileUploaderService.prototype.download = function(filePath, CB, fCB, lastModified, forceDownload) {
    CB = CB || noop;
    var doDownload = () => {
        /**
         * available for use only on desktop
         */
        if (this.fileCache && this.fileCache[filePath] && !forceDownload) {
            return CB(this.toURL(this.fileCache[filePath]));
        }

        this.getFile({ type: 'base64', filePath: filePath })
            .then(res => {
                if (res.result.size) {
                    /**
                     * store and reference the cached file
                     */
                    if (this.fileCache) {
                        this.fileCache[filePath] = res.result.file;
                    }

                    CB(this.toURL(res.result.file, res.result.mimeType));
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
FileUploaderService.prototype.removeFile  = function(filePath) {
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
FileUploaderService.prototype.saveImageToGallery = function(filePath, CBS, CBF) {
    this.fileExists(filePath).then((fileEntry) => {
        cordova.plugins.imagesaver.saveImageToGallery(fileEntry.toURL(), CBS, CBF);
    }, CBF);
}