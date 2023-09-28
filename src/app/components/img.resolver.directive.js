import { FileUploaderService } from "../services/file.service";
import { GlobalService } from "../services/globalservice.factory";
import {AttributeAppender} from '@jeli/core';

Directive({
    selector: 'imgResolver',
    DI: [GlobalService, FileUploaderService, 'ElementRef?'],
    props: ["source=imgResolver", "setAsBackground", 'dimension', 'fallBack', 'blurEffect', 'gender'],
    registry: [{
        type: "listener",
        name: "onDispatcher",
        handler: "dispatcherHandler($event)"
    }],
    events: ['error:event=fallBack()', 'load:event=isBlurImage()']
})
export function ImageResolverDirective(globalService, fileService, elementRef) {
    this._blurCount = 0;
    this.errorLimit = 0;
    this.setAsBackground = false;
    this.dimension = "";
    this.fallBack = undefined;
    this.blurEffect = undefined;
    this.gender = undefined;
    this.globalService = globalService;
    this.fileService = fileService;
    this.elementRef = elementRef;
}

ImageResolverDirective.prototype.didInit = function() {
    this.imageResolver();
};

ImageResolverDirective.prototype.writeImage = function(removeImage, newImage) {
    if (this.setAsBackground) {
        if (removeImage) {
            this.elementRef.nativeElement.removeAttribute('style');
            return;
        }

        AttributeAppender(this.elementRef.nativeElement, 'style', {
            style: {
                'background-image': "url(" + newImage + ")",
                'background-repeat': 'no-repeat',
                'background-size': 'cover',
                'background-position': 'center center'
            }
        });
    } else {
        if (this.dimension) {
            var dimension = this.dimension.split("x").map(Number);
            AttributeAppender(this.elementRef.nativeElement, {
               style: {
                width: dimension[0],
                height: dimension[1]
               }
            });
        }

        AttributeAppender.setProp(this.elementRef.nativeElement, 'src', newImage, true);
    }
}

ImageResolverDirective.prototype.imageResolver = function(imageChanged) {
    if (this.source) {
        // return image if already base64
        if (this.source.indexOf('base64') > -1) {
            return this.writeImage(false, this.fileService.toURL(this.source, 'image/jpeg'));
        }

        this.fileService
            .fileExists(this.source)
            .then(fileEntry => this.writeImage(false, fileEntry.toURL()) ,() => {
                    this.fileService
                        .download(this.source, (imgRet) =>  {
                            if (imgRet) {
                                this.writeImage(false, imgRet);
                            }
                        }, function() {
                            // error handler
                            console.log('unable to download image');
                        }, imageChanged, !!imageChanged);
                })
    } else {
        this.fallback();
    }
}

ImageResolverDirective.prototype.fallback = function() {
    if (this.fallback && !this.errorLimit) {
        if (this.setAsBackground) {
            // this.elementRef.appendChild(dom.createElement("span", {
            //     attributes: {
            //         class: "fa fa-user fa-2x white-text no-image"
            //     }
            // }));
        }
        this.errorLimit++;
        return;
    }
}

ImageResolverDirective.prototype.isBlurImage = function() {
    if (this.blurEffect) {
        AttributeAppender(this.elementRef.nativeElement, {
            id: "css-filter-blur",
            'svg-image-blur': true
        });
    }
};

ImageResolverDirective.prototype.dispatcherHandler = function(event) {
    this.imageResolver(event.value);
};