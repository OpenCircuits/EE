import {Vector,V}     from "../../utils/math/Vector";
import {ClampedValue} from "../../utils/ClampedValue";

import {EEComponent} from "./EEComponent";

export class Battery extends EEComponent {

    public constructor(voltage: number = 1) {
        super(new ClampedValue(1), new ClampedValue(1), V(50, 50));

        this.voltage = voltage;
    }

    public getDisplayName(): string {
        return "Battery";
    }

}
