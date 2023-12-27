import {EventEmitter} from '@jeli/core';
Directive({
    selector: 'swipeRegistry',
    events: [
        "touchstart touchmove touchend:event=handleEvents($event)",
        "swipeRegistryChange:emitter"
    ],
    DI: ['HostElement?']
})
export function SwipeEventRegistry(hostElement) {
    this.hostElement = hostElement;
    this.swipeRegistryChange = new EventEmitter();
    this.evPoint = {
        direction: "",
        x: 0,
        y: 0,
        diff: 0
    };

    this.actions = {
        touchstart: (event) => {
            this.evPoint.x = Math.round(event.targetTouches[0].clientX);
            this.evPoint.y = Math.round(event.targetTouches[0].clientY);
        },
        touchmove: (event) => {
            var x = Math.round(event.targetTouches[0].clientX),
                y = Math.round(event.targetTouches[0].clientY);
            this.evPoint.diff = 0;

            if (this.evPoint.y > y) {
                this.evPoint.direction = "top";
                this.evPoint.diff = this.evPoint.y - y;
            } else {
                this.evPoint.direction = "down";
                this.evPoint.diff = y - this.evPoint.y;
            }

            if (this.evPoint.x > x) {
                this.evPoint.direction = "left";
                this.evPoint.diff = this.evPoint.x - x;
            } else {
                if (this.evPoint.x !== x) {
                    this.evPoint.direction = "right";
                }
            }

            this.swipeRegistryChange.emit({
                state: "move",
                x, y,
                direction: this.evPoint.direction,
                distance: this.evPoint.diff,
                target: this.hostElement
            });
        },
        touchend: () => {
            this.swipeRegistryChange.emit({
                state: "end",
                direction: this.evPoint.direction,
                distance: this.evPoint.diff,
                target: this.hostElement
            });
            this.evPoint.direction = "";
        }
    }

    this.handleEvents = function(event) {
        this.actions[event.type](event);
    }
}