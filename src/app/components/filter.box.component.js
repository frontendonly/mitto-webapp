Directive({
    selector: "filterBox",
    props: ["filterValue=:filterBox"],
    events: ['input:event=inputChanges($event)']
})
export function FilterBoxDirective() {
    this.inputChanges = function(event) {
        var binding = this.filterValue;
        var elements = document.querySelectorAll('[' + binding + ']');
        if (elements.length) {
            var len = elements.length,
                inc = 0,
                inputValue = event.target.value.toLowerCase();
            while (len > inc) {
                var cur = elements[inc];
                if (inputValue) {
                    var attrValue = cur.getAttribute(binding);
                    if (!attrValue.includes(inputValue)) {
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