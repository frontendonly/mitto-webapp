import { EventEmitter } from '@jeli/core';

Element({
    selector: 'mitto-card-box',
    templateUrl: './card-box.element.html',
    styleUrl: './card-box.element.scss',
    props: ['data'],
    events: ['onCardAction:emitter'],
    viewChild: ['cardContainer:HTMLElement=#cardContainer']
})
export function CardBoxElement() {
    this.onCardAction = new EventEmitter();
    this.cardContainer = null;
    this.hasContent = false;
}

CardBoxElement.prototype.cardButtonAction = function (eventData, id) {
    if (eventData.type == 'swipe') {
        var moveOutWidth = document.body.clientWidth * 1.5;
        var card = this.cardContainer.firstElementChild;
        if (id === 'accept') {
            card.style.transform = 'translate(' + moveOutWidth + 'px, -100px) rotate(-30deg)';
        } else {
            card.style.transform = 'translate(-' + moveOutWidth + 'px, -100px) rotate(30deg)';
        }

        eventData.action = id;
    }

    this.onCardAction.emit(eventData);
}

CardBoxElement.prototype.onSwipeRegistry = function (event) {
    var card = this.cardContainer.firstElementChild;
    if (event.state == 'move') {
        card.classList.add('moving');
    }
}

