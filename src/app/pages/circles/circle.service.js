import { DataService } from "../../services/data.service";

Service({
    DI: [DataService]
})
export function CircleService(dataService){
    this.dataService = dataService;
}

CircleService.prototype.getCurrentUserInfo = function(){
    return this.dataService.getCurrentUserInfo();
}

CircleService.prototype.performQuery = function(type, tableName, uid){
    var query = 'select -inf -'+ tableName + ' -%0%';
    var replacer = {
        lookup: {
            table: 'user_info',
            as: 'inf',
            key: '',
            on: 'uid'
        }
    }

    switch (type) {
        case ('interest'):
            replacer.where = "!connected && sid=" + uid;
            replacer.lookup.key = "fid";
            break;
        case ('likes'):
            replacer.where = "!connected && fid=" + uid;
            replacer.lookup.key = "sid";
            break;
        case ('visitors'):
            replacer.where = "notification && visitor_id=" + uid;
            replacer.lookup.key = "visitor_uid";
            break;
        case ('match'):
            replacer.where = "connected";
            replacer.lookup.key = "CASE(WHEN fid=='"+uid+"' THEN 'sid' ELSE WHEN sid == '"+uid+"' THEN 'fid' ELSE null)";
            break;
    };

    return this.dataService.databaseService.core.jQl(query, null, [replacer]);
}