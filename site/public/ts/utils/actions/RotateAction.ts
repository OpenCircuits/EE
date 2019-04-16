import {Vector} from "../math/Vector";

import {Action} from "./Action";
import {EEComponent} from "../../models/eeobjects/EEComponent";

export class RotateAction implements Action {
    private objects: Array<EEComponent>;

    private midpoint: Vector;

    private initialAngles: Array<number>;
    private finalAngles: Array<number>;

    public constructor(objects: Array<EEComponent>, midpoint: Vector, initialAngles: Array<number>, finalAngles: Array<number>) {
        this.objects = objects;
        this.midpoint = midpoint;
        this.initialAngles = initialAngles;
        this.finalAngles = finalAngles;
    }

    private setAngles(angles: Array<number>) {
        for (let i = 0; i < this.objects.length; i++) {
            const obj = this.objects[i];
            obj.getTransform().setRotationAbout(angles[i], this.midpoint);
        }
    }

    public execute(): void {
        this.setAngles(this.finalAngles);
    }

    public undo(): void {
        this.setAngles(this.initialAngles);
    }

}
