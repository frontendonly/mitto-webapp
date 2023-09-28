Directive({
    selector: "filterBox",
    props: ["jModel", "filterBox"],
    DI: ["dom", "ElementRef"],
    registry: [{
        type: 'event',
        name: 'default',
        handler: 'inputChanges($event)'
    }]
}, FilterBoxDirective);

function FilterBoxDirective(dom, elementRef) {
    this.inputChanges = function(event) {
        var binding = this.filterBox;
        var elements = dom.querySelectorAll(document, '[' + binding + ']');
        if (elements.length) {
            var len = elements.length,
                inc = 0,
                inputValue = elementRef.value.toLowerCase();
            while (len > inc) {
                var cur = elements[inc];
                if (inputValue) {
                    var attrValue = cur.getAttribute(binding);
                    if (!$inArray(inputValue, attrValue)) {
                        cur.style.display = 'none';
                    }
                } else {
                    cur.style.display = '';
                }

                inc++;
            }
        }
    };
}