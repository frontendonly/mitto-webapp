import { FoTokenService } from '@jeli/materials';
import { environment } from '../../environments/env';
import * as jdb from '@jeli/jdb/jdb';
import * as UserService from '@jeli/jdb/services/users';
import * as SessionService from '@jeli/jdb/services/sessions';
import * as RealTimeConnector from '@jeli/jdb/connectors/realtime';
import * as SchedulerConnector from '@jeli/jdb/connectors/scheduler';
import { GlobalHttpInterceptor } from './httpInterceptor.factory';

var apiList = require('./api.json');
jdb.API.set(apiList);
// register connectors
jdb.connectors.register('realtime-connector', RealTimeConnector);

Service({
    name: "jDB",
    DI: [FoTokenService, GlobalHttpInterceptor]
});

/**
 * 
 * @param {*} jAuthSessionManager 
 */

export function DatabaseService(foTokenService, globalHttpInterceptor) {
    /**
     * 
     * @param {*} dbKey 
     */
    jdb.registerGlobalInterceptor('request', function (options) {
        globalHttpInterceptor.requestState(options.url);
    })
        .registerGlobalInterceptor('response', function (response) {
            globalHttpInterceptor.responseState(response);
        });

    this.openDB = function (dbKey, resolve) {
        jdb(environment.name, environment.version)
            .isClientMode()
            .open({
                live: 1,
                organisation: environment.space,
                serviceHost: environment.BFF_HOST,
                interceptor: function (options, request) {
                    var token = "Basic " + environment.apiKey;
                    if (request.AUTH_TYPE == 1) {
                        var access = foTokenService.getAccessToken();;
                        if (access) {
                            token = "Bearer " + access.bearer;
                        }
                    }

                    options.headers.Authorization = token;
                    return options;
                },
                storage: environment.storage,
                disableApiLoading: true,
                alwaysCheckSchema: false,
                useFrontendOnlySchema: false,
                ignoreSync: ["configuration"],
                schemaPath: "assets/schema/",
                key: dbKey,
                enableSocket: false
            })
            .onCreate(function (tx, next) {
                next();
            })
            .then(tx => {
                resolve();
                this.core = tx.result;
                this.userServices = new UserService(this.core);
                this.sessionService = new SessionService(this.core);
            })
    }
}

DatabaseService.prototype.closeDB = function (flag) {
    this.core.close(flag);
};

DatabaseService.prototype.getServiceHost = function getServiceHost(addPath, port) {
    var loc = location,
        domain = loc.protocol + "//" + addPath + '.' + loc.hostname;

    return domain;
};

DatabaseService.prototype.truncateAllTables = function (skipTables) {
    this.core.info().forEach(tbl => {
        if (!skipTables.includes(tbl)) {
            this.tx.jQl('truncate -' + tbl.name + ' -yes', {
                onSuccess: function () { }
            })
        }
    })
};

DatabaseService.prototype.initDB = function () {
    return new Promise((resolve) => {
        console.log('Database connected..');
        this.secureStorage(environment.name, dbKey => this.openDB(dbKey, resolve))
    });
};

/**
 * 
 * @param {*} dbKey 
 * @param {*} callback 
 * @returns 
 */
DatabaseService.prototype.secureStorage = function (dbKey, callback) {
    var keyStoreApi = window['cordova'] ? window['cordova']['plugins']['SecureKeyStore'] : null;
    var exists = function (res) {
        callback(res);
    },
        notExists = function () {
            function keyGenerator8Char() {
                return Math.floor((1 + Math.random()) * 0x100000000).toString(16).substring(1);
            }

            var genKey = '',
                i;
            for (i = 0; i < 8; i++) {
                genKey += keyGenerator8Char();
            }
            keyStoreApi
                .set(function () {
                    // trigger our callback
                    // with the generated key
                    callback(genKey);
                }, function () {
                    helper(genKey);
                    // trigger callback with null
                    callback(localStorage["[target]"] || genKey);
                    console.log('unable to retrieve dbKey');
                }, dbKey, genKey);
        },
        helper = function (key) {
            if (!localStorage["[target]"]) {
                localStorage["[target]"] = key;
            }
        };

    if (!keyStoreApi) {
        callback(null);
        return;
    }

    keyStoreApi.get(exists, notExists, dbKey);
}