import {CreateWire} from "../utils/ComponentUtils";

import {EEObject} from "./eeobjects/EEObject";
import {EEComponent} from "./eeobjects/EEComponent";
import {EEWire} from "./eeobjects/EEWire";

import {InputPort}  from "./eeobjects/InputPort";
import {OutputPort} from "./eeobjects/OutputPort";

export class EECircuitDesigner {
	private objects: Array<EEComponent>;
	private wires: Array<EEWire>;
	private updateRequests: number;

	private updateCallback: () => void;

	public constructor(callback: () => void = function(){}) {
		this.updateCallback = callback;

		this.reset();
	}

	public reset(): void {
		this.objects = [];
		this.wires   = [];
		this.updateRequests = 0;
	}

	/**
	 * Method to call when you want to force an update
	 * 	Used when something changed but isn't propagated
	 * 	(i.e. Clock updated but wasn't connected to anything)
	 */
	public forceUpdate(): void {
		this.updateCallback();
	}

    public simulate(): void {

    }

	public addObjects(objects: Array<EEComponent>): void {
		for (let i = 0; i < objects.length; i++)
			this.addObject(objects[i]);
	}

	public addObject(obj: EEComponent): void {
		if (this.objects.includes(obj))
			throw new Error("Attempted to add object that already existed!");

		obj.setDesigner(this);
		this.objects.push(obj);
	}

	public createWire(p1: OutputPort, p2: InputPort): EEWire {
        const wire = CreateWire(p1, p2);
		this.wires.push(wire);
		wire.setDesigner(this);
		return wire;
	}

    public connect(c1: EEComponent, c2: EEComponent): EEWire;
    public connect(c1: EEComponent, i1: number, c2: EEComponent, i2: number): EEWire;
	public connect(c1: EEComponent, i1: any, c2?: EEComponent, i2?: number): EEWire {
        if (i1 instanceof EEComponent)
            return this.connect(c1, 0, i1, 0);
		return this.createWire(c1.getOutputPort(i1), c2.getInputPort(i2));
	}

	public removeObject(obj: EEComponent): void {
		if (!this.objects.includes(obj))
			throw new Error("Attempted to remove object that doesn't exist!");

		// Remove all input and output wires
		let inputs = obj.getInputs();
		let outputs = obj.getOutputs();
		let wires = inputs.concat(outputs);
		for (let wire of wires)
			this.removeWire(wire);

		this.objects.splice(this.objects.indexOf(obj), 1);
		obj.setDesigner(undefined);
	}

	public removeWire(wire: EEWire): void {
		if (!this.wires.includes(wire))
			throw new Error("Attempted to remove wire that doesn't exist!");

		// Completely disconnect from the circuit
		wire.getInput().disconnect(wire);
		wire.getOutput().disconnect();

		this.wires.splice(this.wires.indexOf(wire), 1);
		wire.setDesigner(undefined);
	}

	public getObjects(): Array<EEComponent> {
		return this.objects.slice(); // Shallow copy array
	}

	public getWires(): Array<EEWire> {
		return this.wires.slice(); // Shallow copy array
	}

}
