Element({
    selector: "chat-icons",
    DI: ['ElementRef', 'jChatService', 'dom'],
    registry: [{
        type: "event",
        name: "click",
        handler: "selectIcon($event)"
    }, {
        type: "emitter",
        name: "onIconSelected"
    }]
}, ChatIconsDirective);


function ChatIconsDirective(elementRef, jChatService, dom) {
    this.didInit = function() {
        jChatService.getIcons()
            .then(function(res) {
                //this.icons = [].concat(res.emotions, res.love);
                var idx = 0,
                    parent = {
                        attributes: {
                            class: "pam"
                        },
                        children: []
                    },
                    split = {
                        element: "div",
                        attributes: {
                            class: "row"
                        },
                        children: []
                    };

                [].concat(res.emotions, res.love).forEach(function(item) {
                    if (idx > 5) {
                        idx = 0;
                        parent.children.push(split);
                        split = {
                            element: "div",
                            attributes: {
                                class: "row"
                            },
                            children: []
                        };
                    }

                    split.children.push({
                        element: "div",
                        attributes: {
                            class: "col s2"
                        },
                        children: [{
                            element: "img",
                            attributes: {
                                alt: "",
                                class: "responsive-img",
                                src: item
                            }
                        }]
                    });

                    idx++;
                });

                elementRef.appendChild(dom.createElement("div", parent));
            });
    };

    this.selectIcon = function(event) {
        if (event.target && event.target instanceof HTMLImageElement) {
            this.onIconSelected.emit(event.target.getAttribute('src'));
        }
    };
}