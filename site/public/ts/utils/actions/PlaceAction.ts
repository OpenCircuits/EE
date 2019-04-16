import {Action} from "./Action";
import {EECircuitDesigner} from "../../models/EECircuitDesigner";
import {EEComponent} from "../../models/eeobjects/EEComponent";

export class PlaceAction implements Action {
    private designer: EECircuitDesigner;
    private obj: EEComponent;

    public constructor(designer: EECircuitDesigner, obj: EEComponent) {
        this.designer = designer;
        this.obj = obj;
    }

    public execute(): void {
        this.designer.addObject(this.obj);
    }

    public undo(): void {
        this.designer.removeObject(this.obj);
    }

}
