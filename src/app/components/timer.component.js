Directive({
    selector: 'interval',
    DI: ['GlobalService'],
    props: ["interval", "timer", "holder"]
}, IntervalDirective);

function IntervalDirective(_) {
    _.wTimer = {};
    this.callBack;
    this.timer;

    this.didInit = function() {
        this.timer = this.timer || 60000;
        // _.wTimer[this.holder] = setInterval(function() {
        //     if (dom(ele[0]).is(':visible')) {
        //         (callBack || noop)();
        //     }
        // }, timer);
    };

    this.viewDidDestroy = function() {
        clearInterval(_.wTimer[this.holder]);
        console.log('destroyed');
    };
}