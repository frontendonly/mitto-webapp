Element({
    selector: 'mitto-chat',
    DI: ['viewIntent', "jFlirtDataService", "jChatService", "GlobalService", "googleMapService", "ElementRef", "dom", 'formFieldService'],
    templateUrl: './chat.html',
    viewChild: [{
        selector: ":chat-container",
        prop: "chatContainer",
        type: "="
    }]
}, ChatComponent);

function ChatComponent(viewIntent, jFlirtDataService, jChatService, _, googleMapService, elementRef, dom, formFieldService) {
    this.pollService;
    this.isLoading = true;
    this.chatList = [];
    this._currenctActivity = viewIntent.getCurrentIntent().params;
    this.receiverId = this._currenctActivity.rid;
    this.noConvo = false;
    this.postData = {
        content: "",
        sender: null,
        receiver: this._currenctActivity.rid,
        relative_id: '0',
        status: "unread"
    };
    this.containerIsOpen = false;
    this.isSmiley = false;
    this.chatContainerInfo = null;
    this.textAreaControl = new formFieldService('', {});

    this.loadAllChatMessages = function() {
        var _this = this;
        jFlirtDataService
            .getCurrentUserInfo()
            .then(function(_suser) {
                _this.postData.sender = _suser.uid;
                jFlirtDataService
                    .getUserInfo({
                        uid: _this._currenctActivity.rid
                    })
                    .then(function(_ruser) {
                        _this.chatContainerInfo = {
                            sender: {
                                uid: _suser.uid,
                                image: _suser.profileImage,
                                name: _suser.name,
                                gender: _suser.gender
                            },
                            receiver: {
                                uid: _ruser.uid,
                                image: _ruser.profileImage,
                                name: _ruser.name,
                                gender: _ruser.gender
                            }
                        };
                    });
            });

        // this.startChatHeartBeat();
    };

    this.onMessageLoaded = function(event) {
        this.noConvo = event.value;
    };


    this.openMenu = function() {
        this.containerIsOpen = !this.containerIsOpen;
        this.restructureView(this.containerIsOpen);
    };

    this.restructureView = function(menuOpened, CB) {
        var dataHolder = dom.querySelector(elementRef, '[data-holder]'),
            bottomContainer = dom.querySelector(elementRef, '#_bottomContent');
        if (dataHolder && bottomContainer) {
            var offHeight = Math.round(100 - (_.px2vh(bottomContainer.offHeight) + _.px2vh((dataHolder || {}).offsetTop || 0)));
            dataHolder.style.height = offHeight + 'vh';
            dataHolder.style.overflowX = 'hidden';
        }
        // _.scrollCurrentPage(dataHolder, CB);
    };

    this.selectIcon = function(event) {
        this.postData.type = "attachment";
        this.postData.attachments = {
            type: "sticker",
            file: event.value
        };
        this.openMenu();
        this.send();
    };


    this.openMap = function() {
        viewIntent.openIntent('map', {});
    };

    this.send = function() {
        if ((this.postData.content.replace(/\s/g, '').length) || $isEqual(this.postData.type, "attachment")) {
            this.postData.content = jChatService.convertContent(this.postData.content);
            this.postData.date = +new Date;
            var clone = $copy(this.postData, true);
            jChatService.postMessage(clone);
            this.chatContainer.renderMessages([clone], jChatService.getChatTimeStamp());

            // empty and toggle texarea to default size
            this.rebuildPostData();
            this.noConvo = true;
        }
    };

    this.attachment = function(type) {
        var _this = this;
        this.openMenu();
        _.InitializeCamera(type, function(dataURI) {
            var clone = $copy(postData, true),
                path = jChatService.getFilePath(_this.postData.sender, "chat/");

            clone.type = "attachment";
            clone.date = +new Date;
            clone.attachments = {
                type: "image",
                file: jChatService.getImageAsBlobURL(dataURI, 'image/jpeg'),
                _id: "img_" + +new Date + "_chat_",
                _sending: true
            };
            // draw the image
            _this.chatContainer.renderMessages([clone], jChatService.getChatTimeStamp());

            jChatService
                .$uploadImage(path, _img)
                .then(function(res) {
                    if (res.result.done) {
                        clone.attachments.file = [path, res.result.path].join("");
                        delete clone.attachments._sending;
                        jChatService
                            .postMessage(clone);
                        rebuildPostData();
                    }
                });
        });
    }

    this.checkRelativeId = function() {
        // set relative_id if not defined
        if (!this.postData.relative_id) {
            this.postData.relative_id = this.postData.sender + "." + this.postData.receiver;
        }
    }

    this.rebuildPostData = function() {
        this.textAreaControl.patchValue('');
        delete this.postData.attachments;
        this.checkRelativeId();
        this.postData.type = "message";
    };


    /**
     * jPollEvent Messages
     */
    this.startChatHeartBeat = function() {
        var _this = this;
        pollService = jChatService.startChatHeartBeat(function(res) {
            var ret = [];
            res.result.getData("insert", "messages").forEach(function(item) {
                if ($isEqual(this.chatContainerInfo.sender.uid, item.receiver)) {
                    ret.push(item);
                    _this.checkRelativeId();
                }
            });

            res.result.getData("update", "messages").forEach(function(item) {
                jChatService
                    .updateReadIcon(this.receiverId);
            });

            // render our messages
            if (ret.length) {
                _this.chatContainer.renderMessages(ret, jChatService.getChatTimeStamp());
                ret = null;
            }
        }, _this.chatContainerInfo.sender.uid);
    };

    this.didInit = function() {
        var _this = this;
        // hide top bar
        if (!this.receiverId) {
            // close the activity
        }
        this.loadAllChatMessages();
        googleMapService
            .event.$on('map.close', function(mapObj) {
                _this.postData.type = "attachment";
                _this.postData.attachments = {
                    type: "location",
                    geoInfo: mapObj
                };
                _this.openMenu();
                _this.send();
            });

        this.textAreaControl.valueChanges.subscribe(function(value) {
            _this.postData.content = value;
        });
    };
}

ChatComponent.prototype.viewDidDestroy = function() {
    // this.pollService();
    // hide to bar
};