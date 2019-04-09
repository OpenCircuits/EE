import {V}     from "../../utils/math/Vector";
import {ClampedValue} from "../../utils/ClampedValue";

import {EEComponent} from "./EEComponent";

export class CurrentSource extends EEComponent {

    public constructor(current: number = .005) {
        super(new ClampedValue(1), new ClampedValue(1), V(50, 50));
        //ensure no negative/zero current!!!
        if (current > 0){
            this.current = current;
        } else {
            this.current = .005;
        }
    }

    public getDisplayName(): string {
        return "CurrentSource";
    }

}
