import {Vector} from "../math/Vector";

import {Action} from "./Action";
import {EEComponent} from "../../models/eeobjects/EEComponent";

export class TranslateAction implements Action {
    private objects: Array<EEComponent>;

    private initialPositions: Array<Vector>;
    private finalPositions: Array<Vector>;

    public constructor(objects: Array<EEComponent>, initialPositions: Array<Vector>, finalPositions: Array<Vector>) {
        this.objects = objects;
        this.initialPositions = initialPositions;
        this.finalPositions = finalPositions;
    }

    private setPositions(positions: Array<Vector>) {
        for (let i = 0; i < this.objects.length; i++) {
            const obj = this.objects[i];
            obj.setPos(positions[i]);
        }
    }

    public execute(): void {
        this.setPositions(this.finalPositions);
    }

    public undo(): void {
        this.setPositions(this.initialPositions);
    }

}
