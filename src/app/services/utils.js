import { EventEmitter, EventManager } from "@jeli/core";
import { GoogleMapService } from '@jeli/materials';

export var geoServiceControl = JSON.parse(localStorage.geoServiceControl || '{}');
export var httpInProgress = new EventEmitter();
export var noop = () => {};
export var Pronouns = ['She/Her', 'He/Him'];
export var globalEvents = new EventManager();
export function px2vh(value) {
    return Math.round((100 * value) / document.documentElement.clientHeight);
}

export function px2vw(value) {
    return Math.round((100 * value) / document.documentElement.clientWidth);
}

export function vw2px(d) {
    return Math.round((document.documentElement.clientWidth * d) / 100);
}

export function vh2px(d) {
    return Math.round((document.documentElement.clientHeight * d) / 100);
}

export function scrollCurrentPage(ele, CB) {
    var _current = ele || dom('[view-page]:visible');
    _current
        .stop()
        .animate({
            scrollTop: _current[0].scrollHeight
        }, 1000, (CB || function () { }));

    _current = null;
}

export function getGPSDIFF(address1, address2) {
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
}

export function printLocationDiff(geoLocation1, geoLocation2) {
    var cal = getGPSDIFF(geoLocation1, geoLocation2),
        ret = (cal * 1000),
        type = "meters";
    if (ret > 1000) {
        type = "km";
        ret = cal;
    }

    ret = isNaN(ret) ? 0 : ret;
    return [Math.round(ret), type];
};

export function getUserAge(age, date) {
    return age + (new Date().getFullYear() - new Date(date).getFullYear());
}

export function imageResolver(path) {
    return path || 'assets/images/no-images.png';
}

export function isBlockedUser(user1, user2) {
    return (user2.blockedUser || []).includes(user1.uid) || (user1.blockedUser || []).includes(user2.uid);
}

export function getFlirtStyle(styleId) {
    return ['Traditional', 'Polite', 'Playful', 'Physical', 'Sincere'][styleId];
}

export function getCurrentLocation(callback, force) {
    if (geoServiceControl.lastReceived && geoServiceControl.nextReceiveTime > +new Date && !force) {
        return callback(null);
    }

    GoogleMapService.getCurrentPosition(null, true)
        .then(res => {
            var date = new Date();
            geoServiceControl.lastReceived = date.getTime();
            geoServiceControl.nextReceiveTime = date.setSeconds(3000);
            var address = {};
            if (res.results && res.results.length) {
                geoServiceControl.country = res.results[0].address_components.finf((item) => item.types.includes('country'));
                // save to localStorage
                address = res.results.find(item => item.types.includes("administrative_area_level_1"))
            }

            localStorage.geoServiceControl = JSON.stringify(geoServiceControl);
            callback({
                loc: address,
                latlng: res.latlng
            });
        }, () => callback(null));
};

export function watchPosition(options, success, error) {
    return GoogleMapService.watchPosition(options, success, error)
}