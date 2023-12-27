import { DatabaseService } from "../../services/database.service";
import {MODAL_INSTANCE, MODAL_DATA} from '@jeli/materials';
Element({
    selector: 'report-user-modal',
    DI: [DatabaseService, MODAL_INSTANCE, MODAL_DATA, 'changeDetector?'],
    templateUrl: './reportuser.html',
    exposeView: true
})
export function ReportUserModalElement(databaseService, modalInstance, modalData, changeDetector) {
    this.isSending = false;
    this.modalInstance = modalInstance;
    this.modalData = modalData;
    this.changeDetector = changeDetector;
    this.sesionSerivce = databaseService.sessionService.createSession({
        session_path: "/report/cases/",
        session_id: modalData.id
    });
}

ReportUserModalElement.prototype.sendReport = function() {
    this.isSending = true;
    this.isError = false;
    this.sesionSerivce.put(this.modalData)
    .then(() => {
        this.modalInstance.close();
    }, () => {
        this.isError = true;
        this.isSending = false;
        this.changeDetector.onlySelf();
    });
};