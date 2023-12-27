import { DatabaseService } from "./database.service";

Service({
    DI: [DatabaseService]
})
export function ConfigService(databaseService) {
    this.databaseService = databaseService;
}
ConfigService.prototype.updateConfiguration = function (data) {
    return this.databaseService.core.jQl('update -configuration -%0%', null, [data]);
};

ConfigService.prototype.getConfig = function (fields) {
    return this.databaseService.core.jQl("select -%0% -configuration", null, [fields || '*']);
};