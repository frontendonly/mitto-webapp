Element({
    selector: 'mitto-modal',
    templateUrl: './modal.html',
    style: '.fullscreen-modal .modal-content{min-height:90vh}',
    DI: ['ElementRef?'],
    exposeView: true
})
export function ModalComponent(elementRef) {
    this.overlayZIndex = 1002;
    this.styles = {
        'z-index': 1003,
        'display': 'block',
        'top': '10%'
    };

    this.$close = function() {
        elementRef.remove();
        if (this.modal && this.modal.onClose) {
            this.modal.onClose();
        }
    };

    this.$hide = function() {
        elementRef.style('display', 'none');
    };

    this.$show = function() {
        elementRef.style('display', 'block');
    };

    this.viewDidLoad = function() {
        var self = this;
        var modal = elementRef.nativeElement.querySelector('.modal');
        if (this.modal.hasOwnProperty('autoShow') && !this.modal.autoShow) {
            this.$hide();
        }
        this.styles.top = (document.documentElement.clientHeight - modal.clientHeight) / 2;
        if (this.modal.timeout) {
            setTimeout(function() {
                self.$close();
            }, self.modal.timeout);
        }

        if (this.modal.fullScreen) {
            this.modal.customClass = "fullscreen-modal";
            this.styles.top = "0%";
        }

        if (this.modal.bottom) {
            this.styles.top = '';
            this.styles.bottom = "0%";
        }
    };


    this.customTrigger = function(btn) {
        if (btn.hasOwnProperty('isProcessing')) {
            btn.isProcessing = true;
        }
        var _this = this;
        btn.$action(function() {
            _this.$close();
        });
    }

    this.checkProcessing = function(btn) {
        console.log(btn);
    }
}