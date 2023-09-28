Directive({
    selector: 'chatTextArea',
    DI: ['ElementRef', 'dom'],
    props: ['restructureView', 'control=chatTextArea'],
    registry: [{
        type: "event",
        name: "input blur focus",
        handler: "handleEvents($event)"
    }]
}, JChatTextArea);

function JChatTextArea(elementRef, dom) {
    this.dummy;
    this.handleEvents = function(event) {
        if ($isEqual('input', event.type)) {
            this.control.patchValue(elementRef.value);
        } else {
            this.restructureView($isEqual(event.type, 'focus'));
        }
    };

    this.__ToggleGrowth = function(restructurePage) {
        if (!this.defaultHeight) {
            this.defaultHeight = elementRef.nativeElement.offsetHeight;
        }

        this.dummy.innerHTML = String(this.control.value)
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

        elementRef.style('height', height);
        this.restructureView(restructurePage);
    };

    this.didInit = function() {
        var _this = this;
        this.dummy = dom.createElement('div', {
            styles: {
                height: this.defaultHeight + "px",
                left: "-1000%",
                position: 'absolute'
            }
        });

        elementRef.parent.appendChild(this.dummy);
        this.control.attachView({
            element: elementRef,
            canSetValue: true
        });

        this.control.valueChanges.subscribe(function() {
            _this.__ToggleGrowth(true);
        });
    };

    this.viewDidDestroy = function() {
        this.dummy = null;
    };
}