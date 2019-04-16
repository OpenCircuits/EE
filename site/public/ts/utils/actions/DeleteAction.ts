import {Action} from "./Action";
import {EECircuitDesigner} from "../../models/EECircuitDesigner";
import {EEComponent} from "../../models/eeobjects/EEComponent";

export class DeleteAction implements Action {
    private designer: EECircuitDesigner;
    private obj: EEComponent;

    public constructor(obj: EEComponent) {
        this.designer = obj.getDesigner();
        this.obj = obj;
    }

    public execute(): void {
        this.designer.removeObject(this.obj);
    }

    public undo(): void {
        this.designer.addObject(this.obj);
    }

}
