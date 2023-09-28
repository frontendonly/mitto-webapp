Directive({
    selector: 'swipeRegistry',
    registry: [{
        type: "event",
        name: "touchstart touchmove touchend",
        handler: "handleEvents($event)"
    }, {
        type: "emitter",
        name: "onSwipeEvent"
    }],
    DI: ['ElementRef']
}, SwipeEventRegistry);

function SwipeEventRegistry(elementRef) {
    this.evPoint = {
        direction: "",
        x: 0,
        y: 0,
        diff: 0
    };

    this.handleEvents = function(event) {
        var _this = this;
        var actions = {
            touchstart: function() {
                _this.evPoint.x = Math.round(event.targetTouches[0].clientX);
                _this.evPoint.y = Math.round(event.targetTouches[0].clientY);
            },
            touchmove: function() {
                var x = Math.round(event.targetTouches[0].clientX),
                    y = Math.round(event.targetTouches[0].clientY);
                _this.evPoint.diff = 0;

                if (_this.evPoint.y > y) {
                    _this.evPoint.direction = "top";
                    _this.evPoint.diff = _this.evPoint.y - y;
                } else {
                    _this.evPoint.direction = "down";
                    _this.evPoint.diff = y - _this.evPoint.y;
                }

                if (_this.evPoint.x > x) {
                    _this.evPoint.direction = "left";
                    _this.evPoint.diff = _this.evPoint.x - x;
                } else {
                    if (_this.evPoint.x !== x) {
                        _this.evPoint.direction = "right";
                    }
                }

                _this.onSwipeEvent.emit({
                    state: "move",
                    target: elementRef.nativeElement,
                    direction: _this.evPoint.direction,
                    distance: _this.evPoint.diff
                });
            },
            touchend: function() {
                _this.onSwipeEvent.emit({
                    state: "end",
                    target: elementRef.nativeElement,
                    direction: _this.evPoint.direction,
                    distance: _this.evPoint.diff
                });
                _this.evPoint.direction = "";
            }
        };

        actions[event.type]();
    }
}