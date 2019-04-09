import {Vector,V}     from "../../utils/math/Vector";
import {ClampedValue} from "../../utils/ClampedValue";

import {EEComponent} from "./EEComponent";

export class Resistor extends EEComponent {

    public constructor(resistance: number = 1000) { //make sure resistance is > 0
        super(new ClampedValue(1), new ClampedValue(1), V(50, 50));

        if (resistance <= 0){
            this.resistance = 1000;
        } else {
            this.resistance = resistance;
        }
    }

    public getDisplayName(): string {
        return "Resistor";
    }

}
