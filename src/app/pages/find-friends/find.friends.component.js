import { DataService } from "../../services/data.service";
import {FormControlService} from '@jeli/form';

Element({
    selector: 'mitto-find-friends',
    DI: [DataService, 'changeDetector?'],
    templateUrl: './find-friends.html',
    style: ['.no-image{font-size: 7em}'],
    exposeView: true
})

export function FindFriendsElement(dataService, changeDetector) {
    this.dataService = dataService;
    this.changeDetector = changeDetector;
    this.count = 0;
    this.searchRestricted = false;
    this.searchRestrictions = {};
    this.searchForm = new FormControlService({
        searchValue: null,
        type: {
            value:'username'
        }
    });
    this.userInfo = {};
}

FindFriendsElement.prototype.didInit = function() {
    this.dataService
        .runQuery('select -* -configuration')
        .then((res) => {
            this.searchRestrictions = res.first().restrictions.search;
            if (this.searchRestrictions.timeout && this.searchRestrictions.timeout > +new Date) {
                this.searchRestricted = true;
            }
        });

    this.dataService
        .getCurrentUserInfo()
        .then((userInfo)=> this.userInfo = userInfo);
};

FindFriendsElement.prototype.validate = function(str) {
    return (str.indexOf('@') > -1 ? str : "@" + str);
};

FindFriendsElement.prototype.searchUsers = function() {
    var searchForm = this.searchForm.value;
    if (searchForm.searchValue) {
        this.searchResult = null;
        this.searchMessage = "Searching.....";
        var params = {
            param: {
                gender: this.userInfo.searchFilter.interested,
                blockedUser: {
                    notInArray: [this.userInfo.uid]
                },
                "privacy.available": true
            },
            limit: "JDB_SINGLE"
        };

        params.param[searchForm.type] = searchForm.searchValue;
        if (('username' == searchForm.type)) {
            params.param["privacy.addByMittoId"] = true;
        } else {
            params.param["privacy.addByMobileNumber"] = true;
        }

        this.dataService
            .searchPeopleServer(params, this.userInfo.uid)
            .then(res => {
                // close the 
                this.searchMessage = "";
                this.searchResults = res[0];
                if (!this.searchResults) {
                    this.searchMessage = "User not found";
                    this.count++;
                    if (this.count >= 5) {
                        this.search.restriction = true;
                        this.dataService
                            .updateConfiguration({
                                restrictions: {
                                    search: {
                                        timeout: new Date().setSeconds(21600)
                                    }
                                }
                            });
                    }

                }
                this.changeDetector.detectChanges();
            }, () => {
                this.searchMessage = "User not found";
                this.changeDetector.detectChanges();
            })
    }
};