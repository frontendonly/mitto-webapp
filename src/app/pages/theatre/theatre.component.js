Element({
    selector: 'mitto-theatre',
    DI: ['$webState', "GlobalService"],
    templateUrl: ''
}, TheatreComponent);

function TheatreComponent($webState, _) {
    var currentParams = $webState.getCurrentActivityDetail($webState.$currentActivity).route.params;
    this.controls = {
        currentIndex: 0,
        next: function() {
            this.currentIndex++;
            if (this.currentIndex > currentParams.imageRolls.length) {
                this.currentIndex = 0;
            }
        },
        previous: function() {
            this.currentIndex--;
            if (0 > this.currentIndex) {
                this.currentIndex = currentParams.imageRolls.length - 1;
            }
        },
        getCurrentImage: function() {
            return currentParams.imageRolls[this.currentIndex].src;
        }
    }
}