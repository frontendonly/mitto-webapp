import {ViewIntentService} from '@jeli/router';
Element({
    selector: 'mitto-theatre',
    DI: [ViewIntentService],
    templateUrl: './theatre.html',
    styleUrl:'./theatre.scss',
    exposeView: true
})
export function TheatreComponent(viewIntentService) {
    this.currentParams = viewIntentService.getCurrentIntent().params;
    console.log(this.currentParams)
    this.currentIndex = 0;
}

TheatreComponent.prototype.next = function() {
    this.currentIndex++;
    if (this.currentIndex > this.currentParams.imageRolls.length) {
        this.currentIndex = 0;
    }
}

TheatreComponent.prototype.previous = function() {
    this.currentIndex--;
    if (0 > this.currentIndex) {
        this.currentIndex = this.currentParams.imageRolls.length - 1;
    }
}

TheatreComponent.prototype.getCurrentImage = function() {
    return this.currentParams.imageRolls[this.currentIndex].src;
}