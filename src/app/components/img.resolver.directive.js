import { FileUploaderService } from "../services/file.service";
import { AttributeAppender, DOMHelper } from '@jeli/core';

Directive({
    selector: 'imgResolver',
    DI: [FileUploaderService, 'HostElement?'],
    props: ["source=imgResolver", "setAsBackground", 'dimension', 'fallBack', 'blurEffect', 'gender'],
    events: ['error:event=fallBack()', 'load:event=isBlurImage()']
})
export function ImageResolverDirective(fileService, hostElement) {
    this._blurCount = 0;
    this.errorLimit = 0;
    this.setAsBackground = false;
    this.dimension = "";
    this.fallBack = undefined;
    this.blurEffect = undefined;
    this.gender = undefined;
    this.fileService = fileService;
    this.hostElement = hostElement;
    this.noImage = null;
}

ImageResolverDirective.prototype.toggleNoImage = function(){
    if (this.fallBack && this.noImage){
        this.noImage.classList.toggle('d-none');
    }
}

ImageResolverDirective.prototype.didInit = function(){
    if (this.dimension) {
        var dimension = this.dimension.split("x").map(Number);
        AttributeAppender(this.hostElement.nativeElement, {
            style: {
                width: dimension[0],
                height: dimension[1]
            }
        });
    }
}

ImageResolverDirective.prototype.didChange = function(model){
    if (model.setAsBackground){
       this.noImage =  DOMHelper.createElement('span', {
            class: 'bi bi-person-fill no-image d-none'
        }, null, this.hostElement.nativeElement);
    }

    if (model.hasOwnProperty('source')) {
        this.imageResolver();
    }
}

ImageResolverDirective.prototype.writeImage = function (removeImage, newImage) {
    if (this.setAsBackground) {
        if (removeImage) {
            this.hostElement.nativeElement.removeAttribute('style');
            return;
        }

        AttributeAppender(this.hostElement.nativeElement, {
            style: {
                'background-image': "url(" + newImage + ")",
                'background-repeat': 'no-repeat',
                'background-size': 'cover',
                'background-position': 'center center'
            }
        });
    } else {
        AttributeAppender.setProp(this.hostElement.nativeElement, 'src', newImage, true);
    }
}

ImageResolverDirective.prototype.imageResolver = function (imageChanged) {
    if (this.source) {
        this.toggleNoImage();
        // return image if already base64
        if (this.source.indexOf('base64') > -1) {
            return this.writeImage(false, this.fileService.toURL(this.source, 'image/jpeg'));
        }

        this.fileService
            .fileExists(this.source)
            .then(fileEntry => this.writeImage(false, fileEntry.toURL()), () => {
                this.fileService
                    .download(this.source, (imgRet) => {
                        if (imgRet) {
                            this.writeImage(false, imgRet);
                        }
                    }, function () {
                        // error handler
                        console.log('unable to download image');
                    }, imageChanged, !!imageChanged);
            });
    } else {
        this.fallback();
    }
}

ImageResolverDirective.prototype.fallback = function () {
    if (this.fallback && !this.errorLimit) {
        if (this.setAsBackground) {
            this.toggleNoImage();
        }
        this.errorLimit++;
        return;
    }
}

ImageResolverDirective.prototype.isBlurImage = function () {
    if (this.blurEffect) {
        AttributeAppender(this.hostElement.nativeElement, {
            id: "css-filter-blur",
            'svg-image-blur': true
        });
    }
};

ImageResolverDirective.prototype.viewDidDestroy = function(){
    this.noImage = null;
}