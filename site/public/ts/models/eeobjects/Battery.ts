import {V}     from "../../utils/math/Vector";
import {ClampedValue} from "../../utils/ClampedValue";

import {EEComponent} from "./EEComponent";

export class Battery extends EEComponent {

    public constructor(voltage: number = 1) {
        super(new ClampedValue(1), new ClampedValue(1), V(50, 50));
        //ensure no negative/zero voltage!!!
        if (voltage > 0){
            this.voltage = voltage;
        } else {
            this.voltage = 1;
        }
    }

    public getDisplayName(): string {
        return "Battery";
    }

}
