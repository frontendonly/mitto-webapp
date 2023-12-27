import { AlertService } from "../../services/alert.service";
import { ChatService } from "../../services/chat.service";
import { DataService } from "../../services/data.service";
import { ViewIntentService } from '@jeli/router';

Element({
    selector: 'mitto-message',
    DI: [ViewIntentService, DataService, ChatService, AlertService, 'changeDetector?'],
    templateUrl: './message.html',
    styleUrl: './message.scss',
    exposeView: true
})
export function MessageElement(viewIntent, dataService, chatService, alertService, changeDetector) {
    this.isLoading = true;
    this.viewIntent = viewIntent;
    this.dataService = dataService;
    this.chatService = chatService;
    this.alertService = alertService;
    this.changeDetector = changeDetector;
    this.messages = [];
    this.confirmationState = false;
    this.user = viewIntent.getCurrentIntent().params;
}

MessageElement.prototype.didInit = function () {
    this.loadMessages();
}

MessageElement.prototype.loadMessages = function (reload) {
    this.chatService.getAllMessages(this.user.uid)
        .then(response => {
            this.isLoading = false;
            this.messages = response.getResult();
            this.changeDetector.detectChanges();
        });
};

MessageElement.prototype.openConversation = function (idx) {
    var item = this.messages[idx];
    // set message to read
    item.status = "read";
    this.viewIntent.openIntent('chat', {
        rid: item.rid,
        name: item.name,
        image: item.image,
        sid: item.sid
    });
};

MessageElement.prototype.isUnread = function (item) {
    return (!(item.sid == this.user.uid) && (item.status == 'unread')) ? 'active' : '';
};

MessageElement.prototype.deleteMessage = function (idx) {
    this.confirmationState = true;
    this.alertService.openModal({
        title: 'Delete Action',
        template: '<p>All conversation will be deleted. Click on confirm to proceed.</p>',
        modalStyle: 'modal-dialog-centered',
        showCloseBtn: true,
        buttons: [{
            label: "Confirm",
            dismiss: true,
            class: 'btn btn-primary',
            action: () => this._deleteMessage(idx)
        }]
    });
};

MessageElement.prototype._deleteMessage = function (idx) {
    var item = this.messages[idx];
    this.chatService.deleteMessages([{
        receiver: item.rid,
        sender: item.sid
    }, {
        receiver: item.sid,
        sender: item.rid
    }]).then(() => {
        this.messages.splice(idx, 1);
        this.changeDetector.onlySelf();
    }, () => this.alertService.alert('Unable to delete messages.'));
}

MessageElement.prototype.reloadPage = function () {
    this.messages = [];
    this.loadMessages(true);
};

MessageElement.prototype.onSwipeEvent = function (event, idx) {
    var actions = {
        end: () => {
            // click state
            event.target.nativeElement.removeAttribute('style');
            this.swipeThredshod = false;
            if (!event.direction) {
                this.openConversation(idx);
            }
        },
        move: () => {
            var isLeftDir = ('left' == event.direction);
            event.target.nativeElement.style[isLeftDir ? 'right' : 'left'] = event.distance + "px";
            if (event.distance > 100 && !this.swipeThredshod) {
                this.swipeThredshod = true;
                if (isLeftDir) {
                    this.deleteMessage(idx);
                } else {
                    this.openConversation(idx);
                }
            }
        }
    };

    actions[event.state]();
};