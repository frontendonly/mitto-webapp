import {EventManager, ComponentFactoryResolver} from '@jeli/core';
import { GoogleMapService } from '@jeli/materials';
import { ModalComponent } from '../components/modal/modal.component';

Service({
    name: 'GlobalService'
})
export function GlobalService() {
    this.modalElement;
    this.events = new EventManager();
    this.geoServiceControl = JSON.parse(localStorage.geoServiceControl || '{}');

    this.px2vh = function(value) {
        return Math.round((100 * value) / document.documentElement.clientHeight);
    };

    this.px2vw = function(value) {
        return Math.round((100 * value) / document.documentElement.clientWidth);
    };

    this.vw2px = function(d) {
        return Math.round((document.documentElement.clientWidth * d) / 100);
    };

    this.vh2px = function(d) {
        return Math.round((document.documentElement.clientHeight * d) / 100);
    };
}

GlobalService.prototype.imageResolver = function(path) {
    return path || 'assets/images/no-images.png';
};

GlobalService.prototype.getUserAge = function(age, date) {
    return age + (new Date().getFullYear() - new Date(date).getFullYear());
};

GlobalService.prototype.scrollCurrentPage = function(ele, CB) {
    var _current = ele || dom('[view-page]:visible');
    _current
        .stop()
        .animate({
            scrollTop: _current[0].scrollHeight
        }, 1000, (CB || function() {}));

    _current = null;
};

GlobalService.prototype.openModal = function(opts) {
    var model = null;
    ComponentFactoryResolver(ModalComponent, this.modalElement, function(component, instance) {
        console.log(arguments);
        // _this.modalElement.appendChild(component);
        // instance.modal = opts;
        // model = instance;
    });

    return model;
}

GlobalService.prototype.getGeolocation = function(success, force) {
    var self = this;
    if (this.geoServiceControl.lastReceived && this.geoServiceControl.nextReceiveTime > +new Date && !force) {
        success(null);
        return;
    }

    GoogleMapService.getCurrentPosition(null, true)
    .then(res => {
        var date = new Date();
        this.geoServiceControl.lastReceived = date.getTime();
        this.geoServiceControl.nextReceiveTime = date.setSeconds(3000);
        var address = {};
        if (res.results && res.results.length) {
            this.geoServiceControl.country = res.results[0].address_components.finf((item) => item.types.includes('country'));
            // save to localStorage
            address = res.results.find(item => item.types.includes("administrative_area_level_1"))
        }

        localStorage.geoServiceControl = JSON.stringify(self.geoServiceControl);
        success({
            loc: address,
            latlng: res.latlng
        });
    }, () => success(null));
};

GlobalService.prototype.alert = function(msg, timer, showCloseBtn) {
    return this.openModal({
        title: "Alert",
        template: msg,
        timeout: timer || 2000,
        customClass: "modal-sm",
        showCloseBtn: showCloseBtn
    });
};

GlobalService.prototype.confirm = function(msg, button, showCloseBtn) {
    return this.openModal({
        title: "Please confirm",
        template: msg,
        customClass: "modal-sm",
        buttons: button,
        showCloseBtn: showCloseBtn
    });
};

GlobalService.prototype.getGPSDIFF = function(address1, address2) {
    if (!address1 || !address2) {
        return 0;
    }

    function degreesToRadians(degrees) {
        return degrees * Math.PI / 180;
    }

    var earthRadiusKm = 6371,
        dLat = degreesToRadians(address2.latitude - address1.latitude),
        dLon = degreesToRadians(address2.longitude - address1.longitude);

    var lat1 = degreesToRadians(address1.latitude);
    var lat2 = degreesToRadians(address2.latitude);

    var a = (Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2)),
        c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return earthRadiusKm * c;
};

GlobalService.prototype.printLocationDiff = function(geoLocation1, geoLocation2) {
    var cal = this.getGPSDIFF(geoLocation1, geoLocation2),
        ret = (cal * 1000),
        type = "meters";
    if (ret > 1000) {
        type = "km";
        ret = cal;
    }
    return [Math.round(ret), type];
};

GlobalService.prototype.isBlockedUser = function(user1, user2) {
    return $inArray(user1.uid, user2.blockedUser || []) || $inArray(user2.uid, user1.blockedUser || []);
};

GlobalService.prototype.InitializeCamera = function(type, CB) {
    var camPlugin = navigator['camera'],
        self = this;
    if (camPlugin) {
        var camOptions = {
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
        };

        /**
         * initialize the camera
         */
        camPlugin.getPicture(function(dataUrI) {
            CB("data:image/jpeg;base64," + dataUrI);
        }, function() {
            self.alert("There was an error processing the image, please try again.");
        }, camOptions);
    } else {
        // self.alert("Functionality not available", 2000);
        var input = document.createElement("input");
        input.type = "file";
        input.onchange = function(event) {
            var selectedFile = this.files[0];
            var reader = new FileReader();
            // Read file into memory as UTF-8      
            reader.readAsDataURL(selectedFile);
            // Handle errors load
            reader.onload = function(b4file) {
                CB(b4file.target.result);
            };
            reader.onerror = console.log;
            this.remove();
        };
        // add styling
        input.style.top = "-10000px";
        input.style.position = "absolute";
        document.body.appendChild(input);
        input.click();
    }

};


GlobalService.prototype.watchPosition = function(options, success, error) {
    return GoogleMapService.watchPosition(options, success, error)
};

GlobalService.prototype.getFlirtStyle = function(styleId) {
    return ['Traditional', 'Polite', 'Playful', 'Physical', 'Sincere'][styleId];
};