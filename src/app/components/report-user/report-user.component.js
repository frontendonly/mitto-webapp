Element({
    selector: 'report-user-modal',
    props: ['closeModal', 'reportData'],
    DI: ['$sesionSerivce'],
    templateUrl: './reportuser.html'
}, ReportUserModalComponent);

function ReportUserModalComponent($sesionSerivce) {
    this.isSending = false;
    this.didInit = function() {
        this.sesionSerivce = new $sesionSerivce({
            session_path: "/report/cases/",
            session_id: this.reportData.id
        });
    };


    this.sendReport = function() {
        var _this = this;
        this.isSending = true;
        this.sesionSerivce
            .put(this.reportData, function() {
                _this.closeModal();
                alertService.message('Report sent.', 1500);
            }, function() {
                alertService.message('Unable to file report, please try again later.', 1500);
                _this.isSending = false;
            });
    };

}