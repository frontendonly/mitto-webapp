import { ChatService } from "../../services/chat.service";
import {DOMHelper, EventEmitter } from '@jeli/core';

Element({
    selector: "chat-icons",
    DI: [ChatService, 'HostElement?'],
    events: ['onIconSelected:emitter', 'click:event=selectIcon($event)']
})
export function ChatIconsElement(chatService, hostElement) {
    this.chatService = chatService;
    this.hostElement = hostElement;
    this.onIconSelected = new EventEmitter();
}

ChatIconsElement.prototype.didInit = function () {
    this.chatService.getIcons()
        .then(res => {
            DOMHelper.createElement('div', { class: 'row g-3' }, row => {
                [].concat(res.emotions, res.love).forEach(function (item) {
                    DOMHelper.createElement('div', { class: 'col-2' }, col => {
                        DOMHelper.createElement("img", {
                            alt: "",
                            class: "responsive-img",
                            src: item
                        }, col)
                    }, row);
                });
            }, this.hostElement.nativeElement);
        });
};

ChatIconsElement.prototype.selectIcon = function (event) {
    if (event.target && event.target instanceof HTMLImageElement) {
        this.onIconSelected.emit(event.target.getAttribute('src'));
    }
};