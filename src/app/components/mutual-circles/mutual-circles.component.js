Element({
    selector: 'mitto-mutual-circles',
    props: ['user'],
    DI: ['jFlirtDataService']
}, MutualCirclesComponent);

function MutualCirclesComponent(jFlirtDataService) {
    this.circles = [];
    this.didiInit = function() {
        var _this = this;
        jFlirtDataService.getCircles({
                user: this.user.uid
            })
            .then(function(res) {
                _this.circles = res.result._rec;
                _this.isLoading = false;
            });
    }
}