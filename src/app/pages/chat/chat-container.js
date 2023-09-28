Directive({
    selector: 'chatContainer',
    props: ['chatInfo', 'restructureView', 'postData'],
    DI: ['ElementRef', 'dateTimeFactory', 'dom', 'jChatService', 'viewIntent', "GlobalService", "$fileService", "$actionSheet"],
    registry: [{
        type: "event",
        name: "touchstart touchend",
        handler: "eventHandler($event)"
    }, {
        type: "emitter",
        name: "onMessageLoaded"
    }]
}, ChatContainerDirective);

function ChatContainerDirective(elementRef, dateTimeFactory, dom, jChatService, viewIntent, _, $fileService, $actionSheet) {
    this.isLoading = true;
    var longTimer = null;
    this.didInit = function() {
        var _this = this;
        jChatService.checkUserImage(this.chatInfo.receiver.image, this.chatInfo.receiver.gender, function(img) {
            _this.chatInfo.receiver.profileImage = img;
            _this.loadChat();
        });
    };

    this.loadChat = function() {
        var _this = this;
        jChatService
            .getMessages({
                receiver: this.chatInfo.receiver.uid,
                sender: this.chatInfo.sender.uid
            })
            .then(function(tx) {
                _this.isLoading = false;
                var messages = tx.getResult();
                if (messages.length) {
                    var lastMessage = messages[messages.length - 1];
                    if (messages.length > 1) {
                        _this.postData.relative_id = lastMessage.relative_id;
                    } else {
                        _this.postData.relative_id = lastMessage.sender + "." + lastMessage.receiver;
                    }
                }
                _this.onMessageLoaded.emit(messages.length > 0);
                _this.renderMessages(messages, "");
            }, console.log);
    };

    this.renderMessages = function(messages, timestamp) {
        var cc = messages.length - 1,
            cf = timestamp || "",
            _liDate,
            _ulChat = dom.querySelector(elementRef, 'ul[data-timestamp="' + timestamp + '"]'),
            _liChatb,
            _lastSentChat = false,
            _this = this;
        messages.forEach(function(chat, inc) {
            var ct = dateTimeFactory.$timeConverter(chat.date || ""),
                ctmd = ((ct.timestamp > ct.ctimestamp) ? ct.ctimestamp : ct.timestamp),
                _isMe = $isEqual(chat.sender, _this.chatInfo.sender.uid),
                _last = dom.querySelector(elementRef, "li[data-msgid]"),
                _noBkg = (!!chat.attachments && $inArray(chat.attachments.type, 'sticker')) ? 'noBackground ' : '';
            _lastSentChat = $isEqual(chat.sender, _last);

            if (!$isEqual(cf, ctmd) || !_ulChat) {
                _liDate = dom.createElement('li', {
                    attributes: {
                        class: 'uiChatNotify'
                    },
                    children: [{
                        element: "span",
                        textContent: ((ct.timestamp > ct.ctimestamp) ? ct.msgday : ct.today)
                    }]
                });
                _ulChat = dom.createElement('ul', {
                    attributes: {
                        "data-timestamp": ctmd,
                        class: "clearfix ui-discussion"
                    }
                });
                _liChatb = dom.createElement('li', {
                    attributes: {
                        "data-timestamp": ctmd
                    }
                });
                _liChatb.appendChild(_ulChat);
                elementRef.appendChild(_liDate);
                elementRef.appendChild(_liChatb);
            }
            var _chatMsgBox = dom.createElement('li', {
                attributes: {
                    'data-msgid': chat.sender,
                    'long-click': true,
                    'msg-time': chat.date,
                    'msg-type': (chat.attachments && chat.attachments.type),
                    class: ((_isMe) ? 'self' : 'other') + " clearfix"
                },
                children: [{
                        element: 'div',
                        attributes: {
                            class: (_noBkg) + ((_lastSentChat) ? 'removeBorder ' + ((!_isMe || (!_isMe && !$isEqual(cf, ctmd))) ? 'avatar' : '') : 'avatar')
                        },
                        children: [{
                            condition: ((!_isMe && !_lastSentChat)),
                            element: 'img',
                            attributes: {
                                src: _this.chatInfo.receiver.image,
                                class: "circle"
                            }
                        }]
                    },
                    {
                        element: "div",
                        attributes: {
                            'data-copytext': "P",
                            class: 'messages ' + _noBkg + _this.addImageAttachmentClass(chat.attachments)
                        },
                        children: [_this.writeAttachMents(chat), {
                            element: 'div',
                            attributes: {
                                class: "messagebar"
                            },
                            children: [{
                                element: 'time',
                                attributes: {
                                    "data-time": chat.date,
                                    "datetime": chat.date,
                                    "data-rname": ((_isMe) ? _this.chatInfo.sender.name : _this.chatInfo.receiver.name)
                                },
                                textContent: ["HH", ":", "mm", " ", "tt"].map(function(key) { return ct.flags[key] || key; }).join("").toUpperCase()
                            }, {
                                condition: _isMe,
                                element: "span",
                                attributes: {
                                    "id": "readIcon",
                                    class: 'right mls fa fa-check fa-lg '
                                }
                            }]
                        }]
                    }
                ]
            });

            // append the chat to the box
            _ulChat.appendChild(_chatMsgBox);
            _lastSentChat = _isMe;
            cf = ctmd;
        });

        this.restructureView();
        this.drawLocations();
        this.loadAllChatImages();
        this.updateStatus();
    };

    this.updateStatus = function() {
        jChatService
            .updateMessages({
                data: { status: "read" },
                query: {
                    sender: this.chatInfo.receiver.uid,
                    status: 'unread'
                }
            }, {
                onSuccess: function(res) {}
            });
    };

    this.writeAttachMents = function(chat) {
        var html;
        if (chat.attachments) {
            html = {
                element: 'div',
                attributes: {
                    class: "attachment"
                },
                children: [{
                    condition: $inArray(chat.attachments.type, ['image', 'sticker']),
                    element: "img",
                    attributes: {
                        id: chat.attachments._id,
                        "data-src": chat.attachments.file,
                        "ref-src": chat.attachments.file,
                        "data-type": chat.attachments.type,
                        class: "img " + chat.attachments.type
                    }
                }, {
                    condition: $isEqual('image', chat.attachments.type),
                    element: 'div',
                    attributes: {
                        class: "iloading center"
                    },
                    children: [{
                        element: "h6",
                        textContent: 'Loading Image....'
                    }]
                }]
            };

            if ($inArray(chat.attachments.type, ['location']) && chat.attachments.geoInfo.latLng) {
                html.children.push({
                    element: 'div',
                    attributes: {
                        "data-geolocation": JSON.stringify(chat.attachments.geoInfo.latLng),
                        "data-geoaddress": chat.attachments.geoInfo.address,
                        class: "location"
                    },
                    innerHTML: '<div class="row mbn"><div class="col s12"><h6><i class="fa fa-map-marker"></i> Location</h6> ' + (chat.attachments.geoInfo.address || "") + '</div></div></div>'
                });
            }
        } else {
            html = {
                element: 'p',
                textContent: chat.content
            };
        }

        return html;
    }

    this.addImageAttachmentClass = function(att) {
        return att && att.type === 'image' ? ' chat-resize-width' : '';
    }

    this.loadAllChatImages = function() {
        var _self = this;
        var allImages = dom.querySelectorAll(elementRef, '[data-src]');
        if (allImages.length) {
            var inc = allImages.length;
            for (var inc = 0; inc < allImages.length; inc++) {
                var img = allImages[inc];
                if ($isEqual('sticker', img.getAttribute('data-type'))) {
                    img.src = img.getAttribute('data-src');
                    img.removeAttribute('ref-src');
                } else {
                    chatService
                        .checkUserImage(img.getAttribute('data-src'), null, function(data) {
                            img.parentNode.removeChild(img.parentNode.querySelector('div'));
                            img.src = data;
                            _self.restructureChatContainer();
                        });
                }

                img.removeAttribute('data-src');
            }
        }
    };


    this.drawLocations = function() {
        var allLocations = dom.querySelectorAll(elementRef, '[data-geolocation]');
        if (allLocations.length) {
            for (var inc = 0; inc < allLocations.length; inc++) {
                var loc = allLocations[inc];
                loc.setAttribute('geolocation', loc.getAttribute('data-geolocation'));
                loc.removeAttribute('data-geolocation');
            }
        }
    };

    this.eventHandler = function(event) {
        switch (event.type) {
            case ('touchstart'):
                if (event.target instanceof HTMLImageElement && event.target.getAttribute('ref-src')) {
                    viewIntent.openIntent('theatre', {
                        imageRolls: [{
                            src: event.target.src
                        }]
                    });
                } else if (event.target instanceof HTMLDivElement && event.target.getAttribute('data-geoaddress')) {
                    viewIntent.openIntent('map', {
                        geoLocation: {
                            latLng: JSON.parse(this.getAttribute('geolocation') || '{}'),
                            address: this.getAttribute('geoaddress')
                        }
                    });
                } else if (event.target instanceof HTMLLIElement && event.target.getAttribute('long-click')) {
                    longTimer = setTimeout(function() {
                        if (longTimer) {
                            start = false;
                            openActionMenu(event.target);
                        }
                    }, 500);
                }
                break;
            case ('touchend'):
                if (longTimer) {
                    clearTimeout(longTimer);
                }
                break;
        }
    };

    /**
     * 
     * @param {*} ele 
     */
    function openActionMenu(ele) {
        var labels = ["Delete Message"];
        if ($isEqual(ele.getAttribute('msg-type'), "image")) {
            labels.push('Save Image');
        }

        $actionSheet({
            bottom: true,
            buttonLabels: labels
        }, function(idx) {
            switch (idx) {
                case 1:
                    _.confirm("<h6>Message will be deleted from your device only.</h6>", [{
                        title: "Delete",
                        $action: function(closeModal) {
                            closeModal();
                            jChatService
                                .deleteMessage({
                                    sender: ele.getAttribute('data-msgid'),
                                    date: ele.getAttribute('msg-time')
                                }, function() {
                                    // remove the message
                                    ele.parentNode.removeChild(ele);
                                });
                        }
                    }], true);
                    break;
                case 2:
                    if (labels.length < 2) {
                        return;
                    }

                    $fileService.saveImageToGallery(ele.querySelector('img').getAttribute('ref-src'), function() {
                        _.alert('<h6 class="center">Image saved.</h6>', 1000);
                    }, function(err) {
                        _.alert('<h6 class="center">Unable to save image.</h6>', 1000);
                    });
                    break;
            }
        })
    }
}