import { DatabaseService } from "./database.service";
import { FileUploaderService } from "./file.service";

Service({
    DI: [
        FileUploaderService,
        DatabaseService
    ]
})
export function ChatService(fileService, databaseService) {
    this.databaseService = databaseService;
    this.fileService = fileService;
    this.getFilePath = fileService.getFilePath;
    this.getImageAsBlobURL = fileService.toURL;

    this.convertContent = function(text) {
        var icoE = eicon.replace(/([.?*+^_[\]\\(){}|-])/g, "\\$1")
        return text.replace(new RegExp(icoE, "g"), function() {
            return '<i class="bi-'+EMOTICON[icoE]+'"></i>';
        });
    };

    this.getIcons = function() {
        return Conf.getSmileyConfig();
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

ChatService.prototype.postMessage = function() {
    return this.databaseService.core.jQl('insert -%0% -messages', null, arguments);
};

ChatService.prototype.updateMessages = function(data, handler) {
    this.databaseService.core.jQl('update -messages -%data% -%query%', handler, data);
};

ChatService.prototype.deleteMessage = function() {
    return this.databaseService.core.jQl('delete -messages -%0%', null, arguments);
};

ChatService.prototype.deleteMessages = function() {
    return this.databaseService.core.jQl('delete -messages -%0%', null, arguments);
};

ChatService.prototype.getAllMessages = function(uid) {
    return this.databaseService.core.jQl("select -name,profileImage,content,attachments,type,status,date,CASE(WHEN sender='"+uid+"' THEN receiver ELSE sender) as rid,CASE(WHEN sender='"+uid+"' THEN sender ELSE receiver) as sid -messages -%0%", null, [{
        where: [{relative_id : '0'}],
        lookup: {
            table: "user_info",
            on: 'uid',
            fields: 'name,profileImage',
            merge: true,
            key: "CASE(WHEN sender='"+uid+"' THEN 'receiver' ELSE 'sender')"
        }
    }]);
};