Element({
    selector: 'mitto-message',
    DI: ['viewIntent', "jFlirtDataService", "jChatService", "GlobalService"],
    templateUrl: './message.html',
    styleUrl: './message.css'
}, MessageComponent);

function MessageComponent(viewIntent, jFlirtDataService, jChatService, _) {
    this.isLoading = true;
    this.messages = [];
    this.confirmationState = false;
    this.didInit = function() {
        this.user = viewIntent.getCurrentIntent().params;
        this.loadMessages();
    }

    this.loadMessages = function(reload) {
        var _this = this;
        jChatService.getAllMessages(function(messages) {
            _this.buildMessages(messages, reload);
            _this.isLoading = false;
        });
    };

    this.buildMessages = function(messages) {
        var _this = this;
        //this.messages = [];
        messages.forEach(function(item) {
            var rid = item.sender;
            if ($isEqual(item.sender, _this.user.uid)) {
                rid = item.receiver;
            }

            jFlirtDataService
                .getUserInfo({ uid: rid })
                .then(function(res) {
                    if (_.isBlockedUser(res, _this.user)) {
                        return;
                    }

                    _this.messages.push({
                        name: res.name,
                        image: res.profileImage,
                        rid: rid,
                        sid: _this.user.uid,
                        content: item.content,
                        attachments: item.attachments,
                        type: item.type,
                        status: item.status
                    });
                });

        });
    };

    this.openConversation = function(idx) {
        var item = this.messages[idx];
        // set message to read
        item.status = "read";
        viewIntent.openIntent('chat', {
            rid: item.rid,
            name: item.name,
            image: item.image
        });
    };

    this.isUnread = function(item) {
        return (!$isEqual(item.sid, _this.user.uid) && $isEqual(item.status, "unread")) ? "active" : "";
    };

    this.deleteMessage = function(idx) {
        var _this = this;
        var item = this.messages[idx];
        this.confirmationState = true;
        _.openModal({
            title: 'Delete Action',
            template: '<p>All conversation will be deleted. Click on confirm to proceed.</p>',
            onClose: function() {
                _this.confirmationState = false;
            },
            showCloseBtn: true,
            buttons: [{
                title: "Confirm",
                $action: function(closeModal) {
                    closeModal();
                    _this.confirmationState = false;
                    jChatService.deleteMessages({
                        query: [{
                            receiver: item.rid,
                            sender: item.sid
                        }, {
                            receiver: item.sid,
                            sender: item.rid
                        }]
                    }, function(deleted) {
                        if (deleted) {
                            _this.messages.splice(idx, 1);
                        } else {
                            _.alert("Unable to delete messages.");
                        }
                    });
                }
            }]
        });
    };

    this.reloadPage = function() {
        this.messages = [];
        this.loadMessages(true);
    };

    this.onSwipeEvent = function(event, idx) {
        event.preventDefault();
        switch (event.value.state) {
            case ('end'):
                // click state
                if (!event.value.direction) {
                    this.openConversation(idx);
                } else {
                    event.value.target.removeAttribute('style');
                }
                break;
            case ('move'):
                if ($isEqual('left', event.value.direction)) {
                    event.value.target.style['right'] = event.value.distance + "px";
                    if (event.value.distance > 100 && !this.confirmationState) {
                        return this.deleteMessage(idx);
                    }
                }
                break;
        }
    };
}