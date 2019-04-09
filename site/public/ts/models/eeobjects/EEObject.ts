import {Name} from "../../utils/Name";

import {EECircuitDesigner} from "../EECircuitDesigner";

export abstract class EEObject {
    protected designer?: EECircuitDesigner;
    protected name: Name;

    protected voltage: number;
    protected current: number;
    protected resistance: number;
    protected power: number;

    constructor() {
        this.name = new Name(this.getDisplayName());

        this.voltage = 0;
        this.current = 0;
        this.resistance = 0;
        this.power = 0;
    }

    public setDesigner(designer?: EECircuitDesigner): void {
        this.designer = designer;
    }

    public setName(name: string): void {
        this.name.setName(name);
    }

    public setVoltage(voltage: number): void {
        this.voltage = voltage;
    }

    public setCurrent(current: number): void {
        this.current = current;
    }

    public setResistance(resistance: number): void {
        this.resistance = resistance;
    }

    public setPower(power: number): void {
        this.power = power;
    }

    public getDesigner(): EECircuitDesigner {
        return this.designer;
    }

    public getName(): string {
        return this.name.getName();
    }

    public getVoltage(): number {
        return this.voltage;
    }

    public getCurrent(): number {
        return this.current;
    }

    public getResistance(): number {
        return this.resistance;
    }

    public getPower(): number {
        return this.power;
    }

    public copy(): EEObject {
        let copy: EEObject = new (<any> this.constructor)();
        copy.name = new Name(this.name.getName());
        return copy;
    }

    public abstract getDisplayName(): string;

}
