import { DatabaseService } from "./database.service";
import { FileUploaderService } from "./file.service";

Service({
    DI: [
        FileUploaderService,
        DatabaseService
    ]
})
export function ChatService(fileService, databaseService) {
    var EMOTICON = {
        "o:)": "angel",
        ":3": "colonthree",
        "o.O": "confused",
        ":'(": "cry",
        "3:)": "devil",
        ":(": "frown",
        ":O": "gasp",
        "8)": "glasses",
        ":D": "grin",
        ">:(": "grumpy",
        "<3": "heart",
        "^_^": "kiki",
        ":*": "kiss",
        ":v": "pacman",
        ":)": "smile",
        "-_-": "squint",
        "8|": "sunglasses",
        ":p": "tongue",
        ":/": "unsure",
        ">:O": "upset",
        ";)": "wink"
    };

    this.databaseService = databaseService;
    this.getFilePath = fileService.getFilePath;
    this.getImageAsBlobURL = fileService.toURL;

    this.convertContent = function(text) {
        Object.keys(EMOTICON).forEach(function(eicon) {
            var icoE = eicon.replace(/([.?*+^_[\]\\(){}|-])/g, "\\$1");
            text = text.replace(new RegExp(icoE, "g"), function() {
                return '<img src="/assets/bnsmiley.on1net.com/' + EMOTICON[eicon] + '.gif" class="img" title="' + EMOTICON[eicon] + '">';
            });
        });

        return text
    };

    this.getIcons = function() {
        return Conf.getSmileyConfig();
    };

    this.getChatTimeStamp = function() {
        return Date.now();
    };
}

ChatService.prototype.checkUserImage = function(path, gender, callback, cbf) {
    if (!path) {
        return callback('');
    }

    /**
     * check if base64
     */
    if (path.indexOf('base64') > -1 || path.indexOf('blob:') > -1) {
        return callback(path);
    }

    this.fileService.download(path, callback, cbf);
};


ChatService.prototype.updateReadIcon = function(id) {
    dom('ul#ChatThreadFrame_' + id + " span#readIcon")
        .addClass("read");
}

ChatService.prototype.getTextArea = function() {
    return dom("[view-page]:visible textarea")[0];
};

ChatService.prototype.uploadImage = function(path, _img) {
    return this.fileService.upload({
            type: "base64",
            file: _img,
            path: path,
            fileName: "chat_" + +new Date + ".jpg"
        })
        .then((file) => {
            if (file.result.done) {
                this.fileService
                    .writeFileToDevice({
                        folderPath: path,
                        fileName: file.result.path,
                        file: _img.split(",")[1],
                        contentType: 'image/jpeg'
                    }, function() {});
            }
        });
};


ChatService.prototype.startChatHeartBeat = function(CB, $id) {
    var pollID;
    this.databaseService.core
        .table('_messages_')
        .onSuccess(function(tbl) {
            pollID = tbl.result.onUpdate(CB, 1500, ["insert", "update"], {
                queries: {
                    where: [{
                        "sender": $id
                    },
                    {
                        "receiver": $id
                    }]
                }
            });

            pollID.start();
        });

    /**
     * disconnect from poll
     */
    return function() {
        pollID.disconnect();
    };
}

ChatService.prototype.getMessages = function(replacer) {
    return this.databaseService.core.jQl('select -* -messages -where(receiver=%receiver% && sender=%sender% || receiver=%sender% && sender=%receiver%) orderBy(date)', null, replacer);
};

ChatService.prototype.postMessage = function(postData, handler) {
    handler = handler || {};
    this.databaseService.core.jQl('insert -%0% -messages', {
        onSuccess: handler.onSuccess || noop,
        onError: handler.onError || console.log
    }, [[postData]]);
};

ChatService.prototype.updateMessages = function(data, handler) {
    this.databaseService.core.jQl('update -messages -%data% -%query%', handler, data);
};

ChatService.prototype.deleteMessage = function(query, cb) {
    this.databaseService.core.jQl('delete -messages -sender=%sender% && date=%date%', null, query)
    .then(() => cb(true));
};

ChatService.prototype.deleteMessages = function(query, cb) {
    this.databaseService.core.jQl('delete -messages -where(%query%)', mull, query)
    .then(() => cb(true), () => cb(false));
};

ChatService.prototype.getAllMessages = function(cb) {
    this.databaseService.core.jQl('select -* -messages -groupByStrict(sender,receiver) -limit(0,1)', {
        onSuccess: function(tx) {
            cb(tx.getResult().map(function(item) {
                return item[0];
            }));
        },
        onError: function(err) {
            console.log(err);
            cb([]);
        }
    });
};