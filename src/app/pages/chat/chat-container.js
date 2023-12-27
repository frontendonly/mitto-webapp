import { ChatService } from "../../services/chat.service";
import { ViewIntentService } from '@jeli/router';
import { FileUploaderService } from "../../services/file.service";
import { ActionSheet } from "../../services/actionsheet";
import { DatetimeService } from '@jeli/common/dateTime';
import { DOMHelper, EventEmitter } from '@jeli/core';
import { AlertService } from "../../services/alert.service";

Directive({
    selector: 'chatContainer',
    props: ['chatInfo', 'postData'],
    DI: [
        'HostElement?',
        DatetimeService,
        ChatService,
        ViewIntentService,
        FileUploaderService,
        ActionSheet,
        AlertService
    ],
    events: [
        "touchstart touchend:event=eventHandler($event)",
        "onMessageLoaded:emitter"
    ]
})

export function ChatContainerDirective(hostElement, datetimeService, chatService, viewIntent, fileService, actionSheet, alertService) {
    this.isLoading = true;
    this.hostElement = hostElement;
    this.datetimeService = datetimeService;
    this.chatService = chatService;
    this.viewIntent = viewIntent;
    this.fileService = fileService;
    this.actionSheet = actionSheet;
    this.alertService = alertService;
    this.lastMessageSender = '';
    this.onMessageLoaded = new EventEmitter();
    this.longTimer = null;
}

/**
 * 
 * @param {*} ele 
 */
ChatContainerDirective.prototype.openActionMenu = function (ele, attachmentObj) {
    var labels = ["Delete Message"];
    if ((ele.dataset.msgType === "image")) {
        labels.push('Save Image');
    }

    var deleteMessageAction = () => {
        this.alertService.confirm("<h6>Message will be deleted from your device only.</h6>", [{
            label: "Delete",
            dismiss: true,
            class: 'btn btn-danger',
            action: () => this.chatService
            .deleteMessage({
                id: ele.dataset.msgid
            }).then(function () {
                // remove the message
                ele.remove();
            })
        }], false);
    };

    if (labels.length == 1){
        return deleteMessageAction();
    }

    var actions = {
        1: deleteMessageAction,
        2: () => {
            if (labels.length < 2) return;
            this.fileService.saveImageToGallery(attachmentObj.file).then(() => {
                this.alertService.alert('<h6 class="text-center">Image saved.</h6>', 1000);
            }, () => {
                this.alertService.alert('<h6 class="text-center">Unable to save image.</h6>', 1000);
            });
        }
    }

    this.actionSheet({
        bottom: true,
        buttonLabels: labels
    }, idx => actions[idx]())
}

ChatContainerDirective.prototype.didInit = function () {
    this.chatService.checkUserImage(this.chatInfo.receiver.image, this.chatInfo.receiver.gender, img => {
        this.chatInfo.receiver.profileImage = img;
        this.loadChat();
    });
};

ChatContainerDirective.prototype.loadChat = function () {
    this.chatService.getMessages({
        receiver: this.chatInfo.receiver.uid,
        sender: this.chatInfo.sender.uid
    })
        .then(tx => {
            this.isLoading = false;
            var messages = tx.getResult();
            this.renderMessages(messages, "");
        });
};

ChatContainerDirective.prototype.renderMessages = function (messages, timestamp) {
    var cc = messages.length - 1;
    var cf = timestamp || "";
    var _ulChat = this.hostElement.nativeElement.querySelector('ul[data-timestamp="' + timestamp + '"]');
    messages.forEach((chat) => {
        var ct = this.datetimeService.timeConverter(chat.date || ""),
            ctmd = ((ct.timestamp > ct.ctimestamp) ? ct.ctimestamp : ct.timestamp),
            _isMe = (chat.sender == this.chatInfo.sender.uid),
            _noBkg = (!!chat.attachments && (chat.attachments.type == 'sticker')) ? 'noBackground ' : '';
        var sameAsLastCompiled = (chat.sender == this.lastMessageSender);

        if ((cf != ctmd) || !_ulChat) {
            DOMHelper.createElement('li', {
                class: 'uiChatNotify'
            }, liEle => {
                DOMHelper.createElement("span", {}, ((ct.timestamp > ct.ctimestamp) ? ct.timeago : ct.today), liEle);
            }, this.hostElement.nativeElement);

            _ulChat = DOMHelper.createElement('ul', {
                "data-timestamp": ctmd,
                class: "clearfix ui-discussion"
            });

            DOMHelper.createElement('li', {
                "data-timestamp": ctmd
            }, liChat => {
                liChat.appendChild(_ulChat)
            }, this.hostElement.nativeElement);
        }

        DOMHelper.createElement('li', {
            data: {
                msgid: chat.id,
                'msg-type': (chat.attachments && chat.attachments.type),
                attachments: JSON.stringify(chat.attachments || null),
                'msg-time': chat.date
            },
            'long-click': true,
            class: ((_isMe) ? 'self' : 'other') + " clearfix"
        }, listElement => {
            DOMHelper.createElement('div', {
                class: (_noBkg) + ((sameAsLastCompiled) ? 'removeBorder ' + ((!_isMe || (!_isMe && !$isEqual(cf, ctmd))) ? 'avatar' : '') : 'avatar')
            }, imgEle => {
                if ((!_isMe && !sameAsLastCompiled)) {
                    DOMHelper.createElement('img', {
                        src: _this.chatInfo.receiver.image,
                        class: "rounded-circle"
                    }, null, imgEle)
                }
            }, listElement);

            DOMHelper.createElement('div', {
                'data-copytext': "P",
                class: 'messages text-bg-primary' + _noBkg + (chat.attachments && chat.attachments.type === 'image' ? ' chat-resize-width' : '')
            }, chatEle => {
                // write attachment html
                if (chat.attachments) {
                    DOMHelper.createElement('div', {
                        class: "attachment"
                    }, attachmentEle => {
                        var imageLoader = null
                        if ('image' == chat.attachments.type) {
                            imageLoader =  DOMHelper.createElement('div', {
                                class: "iloading text-center"
                            }, divImage => {
                                DOMHelper.createElement("h6", null, 'Loading Image....', divImage);
                            }, attachmentEle);
                        }

                        if (['image', 'sticker'].includes(chat.attachments.type)) {
                            DOMHelper.createElement("img", {
                                id: chat.attachments._id,
                                class: "img " + chat.attachments.type
                            }, imgEle => this.loadChatImage(imgEle, chat.attachments, imageLoader), attachmentEle);
                        }

                        if ((chat.attachments.type == 'location') && chat.attachments.geometry.location) {
                            DOMHelper.createElement('div', {
                                class: "location"
                            }, mapEle => {
                                DOMHelper.createElement('div', {
                                    class:"col-12",
                                }, mapWrapper => {
                                    DOMHelper.createElement('h6', null, '<i class="bi bi-map"></i> ' + (chat.attachments.name || 'Location'), mapWrapper)
                                    DOMHelper.createTextNode((chat.attachments.formatted_address || ""), mapWrapper);
                                    this.drawLocation(mapWrapper, chat.attachments);
                                }, mapEle)
                            }, attachmentEle);
                        }
                    }, chatEle);
                } else {
                    DOMHelper.createElement('p', null, chat.content, chatEle);
                }

                DOMHelper.createElement('div', { class: "messagebar" }, msgEle => {
                    DOMHelper.createElement('time', {
                        data: {
                            time: chat.date,
                            rname: ((_isMe) ? this.chatInfo.sender.name : this.chatInfo.receiver.name)
                        },
                        datetime: chat.date
                    }, ["HH", ":", "mm", " ", "tt"].map(key => (ct.flags[key] || key)).join('').toUpperCase(), msgEle);
                    if (_isMe) {
                        DOMHelper.createElement("span", {
                            "id": "readIcon",
                            class: 'float-end ms-1 bi-check2 fs-5'
                        }, null, msgEle)
                    }
                }, chatEle);
            }, listElement);
        }, _ulChat);

        sameAsLastCompiled = _isMe;
        cf = ctmd;
        this.lastMessageSender = chat.sender;
    });
    this.onMessageLoaded.emit(messages.length);
    this.updateStatus();
};

ChatContainerDirective.prototype.updateStatus = function () {
    this.chatService
        .updateMessages({
            data: { status: "read" },
            query: {
                sender: this.chatInfo.receiver.uid,
                status: 'unread'
            }
        });
}

ChatContainerDirective.prototype.loadChatImage = function (imgEle, attachmentObj, imageLoader) {
    if ('sticker' == attachmentObj.type) {
        imgEle.src = attachmentObj.file;
    } else {
        this.chatService
            .checkUserImage(attachmentObj.file, null, dataURI => {
                imageLoader.remove();
                imgEle.src = dataURI;
            });
    }
};

ChatContainerDirective.prototype.drawLocation = function (mapEle, attachmentObj) {
    
};

ChatContainerDirective.prototype.eventHandler = function (event) {
    var listEle = event.target.closest('li');
    var attachments = JSON.parse(listEle.dataset.attachments || 'null');
    var eventActions = {
        touchstart: () => {
            this.longTimer = setTimeout(() => {
                this.fromLongTimer = true;
                this.openActionMenu(listEle, attachments);
            }, 500);
        },
        touchend: () => {
            var actions = {
                image: () => {
                    this.viewIntent.openIntent('theatre', {
                        imageRolls: [{
                            src: event.target.src
                        }]
                    });
                },
                location: () => {
                    this.viewIntent.openIntent('map', {
                        geoLocation: {
                            location: attachments.geometry.location,
                            formatted_address: attachments.formatted_address
                        }
                    });
                },
                default: () => { }
            };

            if (!this.fromLongTimer){
                clearTimeout(this.longTimer);
                var actionType = attachments ? attachments.type : 'default';
                actions[actionType]();
            } else {
                this.fromLongTimer = false;
            }
        }
    };

    eventActions[event.type]();
};