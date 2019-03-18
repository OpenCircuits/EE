import {Vector,V}     from "../../utils/math/Vector";
import {ClampedValue} from "../../utils/ClampedValue";

import {EEComponent} from "./EEComponent";

export class Resistor extends EEComponent {

    public constructor(resistance: number) {
        super(new ClampedValue(1), new ClampedValue(1), V(50, 50));

        this.resistance = resistance;
    }

    public getDisplayName(): string {
        return "Resistor";
    }

}
