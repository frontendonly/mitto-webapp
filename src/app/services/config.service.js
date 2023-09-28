import { DatabaseService } from "./database.service";

Service({
    DI: [DatabaseService]
})
export function ConfigService(databaseService) {
    this.databaseService = databaseService;
}
ConfigService.prototype.updateConfiguration = function (data, cb) {
    function handler(ret) {
        return function (err) {
            (cb || noop)(ret, err);
        };
    }

    this.databaseService.core.jQl('update -configuration -%0%', null, [data])
        .then(handler(true), handler(false));
};

ConfigService.prototype.getConfig = function (fields) {
    return this.databaseService.core.jQl("select -%0% -configuration", null, [fields || '*']);
};