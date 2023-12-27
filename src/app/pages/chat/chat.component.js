import { ViewIntentService } from '@jeli/router';
import { DataService } from '../../services/data.service';
import { ChatService } from '../../services/chat.service';
import { FormFieldControlService } from '@jeli/form';
import { FileUploaderService } from '../../services/file.service';
import { px2vh } from '../../services/utils';

var BottomContainerMenu = [
    { icon: 'emoji-laughing', action: 'smiley' },
    { icon: 'camera', action: 'camera' },
    { icon: 'file-image', action: 'photo' },
    { icon: 'pin-map-fill', action: 'map' }
];

Element({
    selector: 'mitto-chat',
    DI: [
        ViewIntentService,
        DataService,
        ChatService,
        FileUploaderService,
        'changeDetector?'
    ],
    templateUrl: './chat.html',
    viewChild: [
        "chatContainer:chatContainer",
        "bottomContainer:HTMLElement=#bottomContent",
        'chatBoxContainer:HTMLElement'
    ],
    styleUrl: './chat.scss',
    exposeView: true
})
export function ChatElement(viewIntent, dataService, chatService, fileUploaderService, changeDetector) {
    this.dataService = dataService;
    this.chatService = chatService;
    this.fileUploaderService = fileUploaderService;
    this.viewIntent = viewIntent;
    this.changeDetector = changeDetector;
    this.pollService;
    this.isLoading = true;
    this.chatList = [];
    this._currenctActivity = viewIntent.getCurrentIntent().params;
    this.receiverId = this._currenctActivity.rid;
    this.noConvo = false;
    this.userLoaded = false;
    this.postData = {
        content: "",
        sender:null,
        receiver: this._currenctActivity.rid,
        relative_id: '0',
        status: "unread"
    };
    this.containerIsOpen = false;
    this.isSmiley = false;
    this.chatContainerInfo = {
        sender: {
            uid: null,
            image: null,
            name: null
        },
        receiver: {
            uid: this._currenctActivity.rid,
            image: this._currenctActivity.image,
            name: this._currenctActivity.name
        }
    };
    this.textAreaControl = new FormFieldControlService('', {});
    this.stickerMenus = BottomContainerMenu;
    this.intentCloseEvent = viewIntent.onCloseEvent.subscribe(event => {
        if (event.intent == 'map' && event.data) {
            this.postData.type = "attachment";
            this.postData.attachments = Object.assign({type: "location"}, event.data);
            this.openMenu();
            this.send();
        }
    });
}

ChatElement.prototype.didInit = function () {
    // hide top bar
    if (!this.receiverId) {
        // close the activity
    }

    this.loadAllChatMessages();
    this.textAreaControl.valueChanges.subscribe(value => {
        this.postData.content = value;
    });
};

ChatElement.prototype.loadAllChatMessages = function () {
    this.dataService
        .getCurrentUserInfo()
        .then(currentUser => {
            this.postData.sender = currentUser.uid;
            this.userLoaded = true;
            Object.assign(this.chatContainerInfo, {
                sender: {
                    uid: currentUser.uid,
                    image: currentUser.profileImage,
                    name: currentUser.name
                }
            });
            this.changeDetector.onlySelf();
        });

    // this.startChatHeartBeat();
};

ChatElement.prototype.onMessageLoaded = function (totalMessages) {
    this.noConvo = totalMessages < 1;
    this.postData.relative_id = String(totalMessages > 0 ? 1 : 0)
    this.restructureView();
};


ChatElement.prototype.openMenu = function () {
    this.containerIsOpen = !this.containerIsOpen;
    this.restructureView(this.containerIsOpen);
};

ChatElement.prototype.restructureView = function () {
    if (this.chatBoxContainer && this.bottomContainer) {
        var offHeight = Math.round(100 - (px2vh(this.bottomContainer.offHeight) + px2vh((this.chatBoxContainer || {}).offsetTop || 0)));
        this.chatBoxContainer.style.height = offHeight + 'vh';
        this.chatBoxContainer.style.overflowX = 'hidden';
    }
    // scrollCurrentPage(dataHolder, CB);
};

ChatElement.prototype.selectIcon = function (event) {
    this.postData.type = "attachment";
    this.postData.attachments = {
        type: "sticker",
        file: event.value
    };
    this.openMenu();
    this.send();
};

ChatElement.prototype.openMap = function () {
    this.viewIntent.openIntent('map', {});
};

ChatElement.prototype.send = function () {
    if ((this.postData.content.replace(/\s/g, '').length) || (this.postData.type == "attachment")) {
        var clonedMessage = Object.assign({
            type: "message"
        }, this.postData);

        this.chatContainer.renderMessages([clonedMessage], Date.now());
        this.sendMessage(clonedMessage);
    }
};

ChatElement.prototype.sendMessage = function (message) {
    this.chatService.postMessage([message])
        .then((res) => { }, err => {
            console.log(err);
        });
    // empty and toggle texarea to default size
    this.rebuildPostData();
    this.noConvo = false;
}

ChatElement.prototype.attachment = function (type) {
    this.openMenu();
    this.fileUploaderService.filePicker(type)
        .then(file => {
            var timeStamp = +new Date
            var clonedMessage = Object.assign({
                type: "attachment",
                date: timeStamp,
                attachments: {
                    type: "image",
                    file: this.chatService.getImageAsBlobURL(file.dataUri, 'image/jpeg'),
                    _id: "img_" + timeStamp + "_chat_",
                    _sending: true
                }
            }, this.postData);
            var path = this.fileUploaderService.getFilePath(this.postData.sender, "chat/");
            // draw the image
            this.chatContainer.renderMessages([clonedMessage], Date.now());
            this.fileUploaderService.upload({
                file: file.dataUri,
                path,
                fileName: "img_" + timeStamp + "." + file.mimeType,
                replaceIfExists: true
            }, true).then((res) => {
                if (res.files.length) {
                    clonedMessage.attachments.file = [path, res.files[0].name].join("");
                    delete clonedMessage.attachments._sending;
                    this.sendMessage(clonedMessage);
                }
            });
        });
}

ChatElement.prototype.checkRelativeId = function () {
    // set relative_id if not defined
    if (!this.postData.relative_id) {
        this.postData.relative_id = '1';
    }
}

ChatElement.prototype.rebuildPostData = function () {
    this.textAreaControl.patchValue('');
    delete this.postData.attachments;
    this.checkRelativeId();
};


/**
 * jPollEvent Messages
 */
ChatElement.prototype.startChatHeartBeat = function () {
    this.pollService = this.chatService.startChatHeartBeat(res => {
        var ret = [];
        res.result.getData("insert", "messages").forEach(item => {
            if ((this.chatContainerInfo.sender.uid == item.receiver)) {
                ret.push(item);
                this.checkRelativeId();
            }
        });

        res.result.getData("update", "messages").forEach(item => {
            this.updateReadIcon(this.receiverId);
        });

        // render our messages
        if (ret.length) {
            this.chatContainer.renderMessages(ret, Date.now());
            ret = null;
        }
    }, this.chatContainerInfo.sender.uid);
};



ChatElement.prototype.viewDidDestroy = function () {
    this.intentCloseEvent && this.intentCloseEvent();
    // this.pollService();
    // hide to bar
};

ChatElement.prototype.updateReadIcon = function (id) {
    this.chatBoxContainer.querySelector('span#readIcon').addClass("read");
}

ChatElement.prototype.getTextArea = function () {
    return dom("[view-page]:visible textarea")[0];
};

ChatElement.prototype.onSelectedMenu = function (action) {
    return ({
        smiley: () => this.isSmiley = !this.isSmiley,
        camera: () => this.attachment('CAMERA'),
        photo: () => this.attachment('SAVEDPHOTOALBUM'),
        map: () => this.openMap()
    }[action]())
}