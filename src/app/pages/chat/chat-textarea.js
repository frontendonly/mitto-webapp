import {AttributeAppender, DOMHelper, EventEmitter} from '@jeli/core';

Directive({
    selector: 'chatTextArea',
    DI: ['HostElement?'],
    events: [ 
        "input blur focus:event=handleEvents($event)", 
        'chatTextAreaChange:emitter'
    ]
})
export function ChatTextAreaDirective(hostElement) {
    this.chatTextAreaChange = new EventEmitter();
    this.hostElement = hostElement;
    this.dummy;
}

ChatTextAreaDirective.prototype.handleEvents = function(event) {
    if (('input' == event.type)) {
        this.__ToggleGrowth(event.target.value);
        this.chatTextAreaChange.emit({
            value: event.target.value
        });
    }
};

ChatTextAreaDirective.prototype.__ToggleGrowth = function(value) {
    if (!this.defaultHeight) {
        this.defaultHeight = this.hostElement.nativeElement.offsetHeight;
    }

    this.dummy.innerHTML = String(value)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\n/g, '<br />');

    var height = this.dummy.offsetHeight;
    if (this.defaultHeight > height) {
        height = this.defaultHeight;
    }

    AttributeAppender(this.hostElement.nativeElement, {style:{height}});
};

ChatTextAreaDirective.prototype.viewDidLoad = function() {
    this.defaultHeight = this.hostElement.nativeElement.clientHeight;
    this.dummy = DOMHelper.createElement('div', {
        style: {
            left: "-1000%",
            position: 'absolute'
        }
    }, null, this.hostElement.nativeElement.parentElement);
};

ChatTextAreaDirective.prototype.viewDidDestroy = function() {
    this.dummy = null;
    this.chatTextAreaChange.destroy();
};