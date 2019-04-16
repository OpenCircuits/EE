import {Action} from "./Action";
import {EEObject} from "../../models/eeobjects/EEObject";
import {EEPort} from "../../models/eeobjects/EEPort";

import {SelectionTool} from "../tools/SelectionTool";

export class SelectAction implements Action {
    private selectionTool: SelectionTool;
    private obj: EEObject | EEPort;

    // True if we should deselect while executing and select while undoing
    private flip: boolean;

    public constructor(selectionTool: SelectionTool, obj: EEObject | EEPort, flip: boolean = false) {
        this.selectionTool = selectionTool;
        this.obj = obj;
        this.flip = flip;
    }

    public execute(): void {
        if (this.flip)
            this.selectionTool.removeSelection(this.obj);
        else
            this.selectionTool.addSelection(this.obj);
    }

    public undo(): void {
        if (this.flip)
            this.selectionTool.addSelection(this.obj);
        else
            this.selectionTool.removeSelection(this.obj);
    }

}
