Directive({
    selector: 'buildSelectBox',
    DI: ['ElementRef'],
    props: ['config=buildSelectBox']
}, buildSelectBoxFn);

function buildSelectBoxFn(ElementRef) {
    var options = "";
    this.didInit = function() {
        console.log(this);
        var _this = this;
        Object.keys(this.config).forEach(function(key) {
            var conf = _this.config[key];
            switch (conf.customize) {
                case "custom":
                    for (var l = conf.selOptions.optValues, i = new Array("Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"), s = l.start_num; s <= l.end_num; s++) {
                        var val = l.autoDate ? i[s - 1] : s;
                        options += '<option value="' + (10 > s ? "0" + s : s) + '" ' + ($isEqual(t.selOptions.OptSelected, s) ? "selected" : "") + ">" + val + "</option>";
                    }
                    break;
                case "cvalue":
                case ("user_define"):
                    var l = t.selOptions;
                    // forEach(l, function(a, l) {
                    // 	if (!$isEqual(a, config.hideOptionsValue)) {
                    // 		(options += '<option value="' + a + '"  ' + ($isEqual(t.OptSelected, a) ? "selected" : "") + '">' + l + "</option>");
                    // 	}
                    // });
            }
        });
    }

}