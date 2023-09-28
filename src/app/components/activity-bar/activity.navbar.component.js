import {ViewIntentService} from '@jeli/router';
import {EventEmitter} from '@jeli/core';

Element({
    selector: "activity-nav-bar",
    props: ["pageTitle", "previous"],
    DI: [ViewIntentService],
    events: ['onClose:emitter'],
    templateUrl: './activity-bar.html'
})
export function ActivityNavBarElement(viewIntent) {
    this.pageTitle = "Mitto";
    this.onClose = new EventEmitter();
    this.closeActivity = function() {
        this.onClose.emit(true);
        viewIntent.closeIntent();
    };
}