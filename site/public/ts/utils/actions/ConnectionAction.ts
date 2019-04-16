import {Action} from "./Action";
import {EECircuitDesigner} from "../../models/EECircuitDesigner";
import {InputPort} from "../../models/eeobjects/InputPort";
import {OutputPort} from "../../models/eeobjects/OutputPort";
import {EEWire} from "../../models/eeobjects/EEWire";

export class ConnectionAction implements Action {
    private designer: EECircuitDesigner;

    private input: OutputPort;
    private output: InputPort;

    public constructor(w: EEWire) {
        this.designer = w.getDesigner();

        this.input = w.getInput();
        this.output = w.getOutput();
    }

    public execute(): void {
        this.designer.createWire(this.input, this.output);
    }

    public undo(): void {
        this.designer.removeWire(this.output.getInput());
    }

}
