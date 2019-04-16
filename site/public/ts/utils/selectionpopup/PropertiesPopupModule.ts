import {GRID_SIZE} from "../Constants";

import {Vector} from "../math/Vector";
import {EEComponent} from "../../models/eeobjects/EEComponent";
import {MainDesignerController} from "../../controllers/MainDesignerController";
import {SelectionPopupModule} from "./SelectionPopupModule";

export class PropertiesPopupModule extends SelectionPopupModule {
    private voltageInput: HTMLInputElement;
    private currentInput: HTMLInputElement;
    private resistanceInput: HTMLInputElement;

    public constructor(parent_div: HTMLDivElement) {
        super(parent_div.querySelector("div#popup-properties"));

        this.voltageInput    = this.div.querySelector("input#popup-voltage");
        this.currentInput    = this.div.querySelector("input#popup-current");
        this.resistanceInput = this.div.querySelector("input#popup-resistance");

        this.voltageInput.oninput    = () => this.push();
        this.currentInput.oninput    = () => this.push();
        this.resistanceInput.oninput = () => this.push();
    }

    public pull(): void {
        const selections = MainDesignerController.GetSelections();

        if (selections.length == 0) {
            this.setEnabled(false);
            return;
        }

        let voltage    = selections[0].getVoltage();
        let current    = selections[0].getCurrent();
        let resistance = selections[0].getResistance();

        selections.forEach(o => {
            voltage    = (voltage    == o.getVoltage()    ? voltage:    null);
            current    = (current    == o.getCurrent()    ? current:    null);
            resistance = (resistance == o.getResistance() ? resistance: null);
        });

        // ""+(+x.toFixed(2)) is a hack to turn the fixed string
        //  back into a number so that trailing zeros go away
        this.voltageInput.value = (voltage == null) ? "" : ""+(+(voltage).toFixed(8));
        this.voltageInput.placeholder = (voltage == null) ? "-" : "";
        this.currentInput.value = (current == null) ? "" : ""+(+(current).toFixed(8));
        this.currentInput.placeholder = (current == null) ? "-" : "";
        this.resistanceInput.value = (resistance == null) ? "" : ""+(+(resistance).toFixed(8));
        this.resistanceInput.placeholder = (resistance == null) ? "-" : "";

        this.setEnabled(true);
    }

    public push(): void {
        const selections = MainDesignerController.GetSelections();

        selections.forEach(c => {
            c.setVoltage   (this.voltageInput.value    == "" ? c.getVoltage()    : this.voltageInput.valueAsNumber);
            c.setCurrent   (this.currentInput.value    == "" ? c.getCurrent()    : this.currentInput.valueAsNumber);
            c.setResistance(this.resistanceInput.value == "" ? c.getResistance() : this.resistanceInput.valueAsNumber);
        });

        MainDesignerController.Render();
    }
}
