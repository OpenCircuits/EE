import {LEFT_MOUSE_BUTTON,
        SHIFT_KEY, DELETE_KEY,
        BACKSPACE_KEY, ESC_KEY,
        A_KEY, IO_PORT_RADIUS} from "../Constants";
import {Vector,V} from "../math/Vector";
import {Transform} from "../math/Transform";
import {TransformContains,
        CircleContains,
        BezierContains,
        RectContains} from "../math/MathUtils";
import {SeparatedComponentCollection,
        GatherGroup} from "../ComponentUtils";

import {Tool} from "./Tool";

import {EECircuitDesigner} from "../../models/EECircuitDesigner";
import {EEObject} from "../../models/eeobjects/EEObject";
import {EEComponent} from "../../models/eeobjects/EEComponent";

import {PlaceComponentTool} from "./PlaceComponentTool"

import {Input} from "../Input";
import {Camera} from "../Camera";
import {EEPort} from "../../models/eeobjects/EEPort";

import {Action} from "../actions/Action";
import {GroupAction} from "../actions/GroupAction";
import {SelectAction} from "../actions/SelectAction";
import {DeleteAction} from "../actions/DeleteAction";
import {DeleteWireAction} from "../actions/DeleteWireAction";

export class SelectionTool extends Tool {

    private designer: EECircuitDesigner;
    private camera: Camera;

    private selections: Array<EEObject>;
    private portSelections: Array<EEPort>;
    private selecting: boolean;

    // These functions are called every time the selections change
    // TODO: pass selections as argument
    private callbacks: Array<{ (): void }>;

    // Current selection box positions
    private p1: Vector;
    private p2: Vector;

    private currentPressedObj: EEObject;
    private pressedObj: boolean;

    private disabledSelections: boolean;

    private lastAction: Action;

    public constructor(designer: EECircuitDesigner, camera: Camera) {
        super();

        this.designer = designer;
        this.camera = camera;

        this.selections = [];
        this.portSelections = [];
        this.selecting = false;

        this.disabledSelections = false;

        this.lastAction = undefined;

        this.callbacks = [];
    }

    private selectionsChanged(): void {
        this.callbacks.forEach(c => c());
    }

    private setAction(action: Action) {
        // Don't set action if it's an empty group action
        if (action instanceof GroupAction && action.isEmpty())
            return;

        this.lastAction = action;
    }

    private add<T>(arr: Array<T>, obj: T): boolean {
        // Check if we're in array
        if (!arr.includes(obj)) {
            arr.push(obj);
            return true;
        }
        return false;
    }

    private remove<T>(arr: Array<T>, obj: T): boolean {
        // Find index of obj in array
        const i = arr.indexOf(obj);
        if (i != -1) {
            arr.splice(i, 1);
            return true;
        }
        return false;
    }

    public addSelection(obj: EEObject | EEPort): boolean {
        // Don't select anything if it's disabled
        if (this.disabledSelections)
            return false;

        // Determine if we're adding to portSelections or regular selections
        if (obj instanceof EEObject) {
            if (this.add(this.selections, obj))
                this.selectionsChanged();
        } else {
            if (this.add(this.portSelections, obj))
                this.selectionsChanged();
        }

        return false;
    }

    public addSelections(objs: Array<EEObject> | Array<EEPort>): boolean {
        // Don't select anything if it's disabled
        if (this.disabledSelections)
            return false;
        if (objs.length == 0)
            return false;

        // Determine if we're adding to portSelections or regular selections
        for (let o of objs) {
            if (o instanceof EEObject)
                this.add(this.selections, o);
            else
                this.add(this.portSelections, o);
        }

        this.selectionsChanged();

        return true;
    }

    public removeSelection(obj: EEObject | EEPort): boolean {
        // Don't deselect anything if it's disabled
        if (this.disabledSelections)
            return false;

        // Determine if we're removing from portSelections or regular selections
        if (obj instanceof EEObject) {
            if (this.remove(this.selections, obj))
                this.selectionsChanged();
        } else {
            if (this.remove(this.portSelections, obj))
                this.selectionsChanged();
        }

        return false;
    }

    // Returns true if it was selected, false if it was deselected
    public toggleSelection(obj: EEObject): boolean {
        // Don't deselect anything if it's disabled
        if (this.disabledSelections)
            return;

        // If we can add it, return true
        if (this.add(this.selections, obj)) {
            return true;
        } else {
            // Else we must remove it and return false
            this.remove(this.selections, obj);
            return false;
        }
    }

    public selectAll(): void {
        const objects = this.designer.getObjects();

        const group = new GroupAction();

        // Clear previous selections
        group.add(this.clearSelections());

        // Add action for each selection
        objects.forEach((obj) => group.add(new SelectAction(this, obj)));

        this.addSelections(objects);
        this.setAction(group);
    }

    public clearSelections(): Action {
        const group = new GroupAction();
        if (this.selections.length == 0 && this.portSelections.length == 0)
            return group;

        // Create actions
        this.selections.forEach((obj) => group.add(new SelectAction(this, obj, true)));
        this.portSelections.forEach((port) => group.add(new SelectAction(this, port, true)));

        // Clear the selections
        this.selections = [];
        this.portSelections = [];

        this.selectionsChanged();
        return group;
    }

    public setCurrentlyPressedObj(obj: EEObject): void {
        this.currentPressedObj = obj;
    }

    public disableSelections(val: boolean = true) {
        this.disabledSelections = val;
    }

    public activate(currentTool: Tool, event: string, input: Input, button?: number): boolean {
        if (event == "mouseup")
            this.onMouseUp(input, button);
        if (event == "onclick" && !(currentTool instanceof PlaceComponentTool))
            this.onClick(input, button);
        return false;
    }

    public deactivate(event: string, input: Input, button?: number): boolean {
        this.selecting = false;

        return false;
    }

    public onMouseDown(input: Input, button: number): boolean {
        if (button === LEFT_MOUSE_BUTTON) {
            let worldMousePos = this.camera.getWorldPos(input.getMousePos());

            let objects = this.designer.getObjects();
            for (let i = objects.length-1; i >= 0; i--) {
                let obj = objects[i];

                // Check if we pressed the object
                if (obj.isWithinPressBounds(worldMousePos)) {
                    this.pressedObj = true;
                    this.currentPressedObj = obj;
                    return true;
                }
                // If just the selection box was hit then
                //  don't call the press() method, just set
                //  currentPressedObj to potentially drag
                else if (obj.isWithinSelectBounds(worldMousePos)) {
                    this.pressedObj = false;
                    this.currentPressedObj = obj;
                    return false;
                }
            }

            // Go through every wire and check to see if it has been pressed
            const w = this.designer.getWires().find((w) => BezierContains(w.getShape(), worldMousePos));
            if (w) {
                this.pressedObj = false;
                this.currentPressedObj = w;
            }
        }

        return false;
    }

    public onMouseDrag(input: Input, button: number): boolean {
        // Update positions of selection
        //  box and set selecting to true
        if (button === LEFT_MOUSE_BUTTON && !this.disabledSelections) {
            this.selecting = true;

            // Update selection box positions
            this.p1 = input.getMouseDownPos();
            this.p2 = input.getMousePos();

            return true; // should render
        }

        return false;
    }

    public onMouseUp(input: Input, button: number): boolean {
        // Find selections within the
        //  current selection box
        if (button === LEFT_MOUSE_BUTTON) {
            // Release currently pressed object
            if (this.pressedObj) {
                this.pressedObj = false;
                this.currentPressedObj = undefined;
                return true;
            }
            this.currentPressedObj = undefined;

            // Stop selection box
            if (this.selecting) {
                this.selecting = false;

                // Create action
                const group = new GroupAction();

                // Clear selections if no shift key
                if (!input.isKeyDown(SHIFT_KEY))
                    group.add(this.clearSelections());


                // Calculate transform rectangle of the selection box
                const p1 = this.camera.getWorldPos(input.getMouseDownPos());
                const p2 = this.camera.getWorldPos(input.getMousePos());
                const box = new Transform(p1.add(p2).scale(0.5), p2.sub(p1).abs());

                // Go through each object and see if it's within
                //  the selection box
                const objects = this.designer.getObjects();
                const selections = objects.filter((obj) => TransformContains(box, obj.getTransform()));

                // Add actions
                group.add(selections.map((obj) => new SelectAction(this, obj)));

                this.addSelections(selections);

                // Select ports if we haven't selected any regular objects
                if (!this.selections.some((s) => s instanceof EEObject)) {
                    // Get all ports from each object
                    const ports = objects.map((obj) => obj.getPorts()).reduce((acc, ports) => acc = acc.concat(ports), new Array<EEPort>());

                    // Filter out ports within the selection box
                    const portSelections = ports.filter((port) => RectContains(box, port.getWorldTargetPos()));

                    // Add actions
                    group.add(portSelections.map((port) => new SelectAction(this, port)));

                    this.addSelections(portSelections);
                }

                // Set as action if we changed selections added something
                this.setAction(group);

                return true; // should render
            }
        }

        return false;
    }

    public onClick(input: Input, button: number): boolean {
        if (button === LEFT_MOUSE_BUTTON) {
            let worldMousePos = this.camera.getWorldPos(input.getMousePos());

            let render = false;

            const group = new GroupAction();

            // Clear selections if no shift key
            if (!input.isShiftKeyDown()) {
                group.add(this.clearSelections());
                render = !group.isEmpty(); // Render if selections were actually cleared
            }

            // Check if an object was clicked
            //  and add to selections
            const objects = this.designer.getObjects();
            for (let i = objects.length-1; i >= 0; i--) {
                const obj = objects[i];

                if (obj.isWithinSelectBounds(worldMousePos)) {
                    let selected = true;

                    // Toggle selection if we're holding shift
                    if (input.isShiftKeyDown()) {
                        selected = this.toggleSelection(obj);
                    } else {
                        // Add selection
                        this.addSelection(obj);
                    }
                    group.add(new SelectAction(this, obj, !selected));
                    render = true;
                    break;
                }
                // Check if a port was clicked
                else {
                    if (obj.getPorts().some((p) => CircleContains(p.getWorldTargetPos(), IO_PORT_RADIUS, worldMousePos)))
                        return false;
                }
            }

            // Go through every wire and check to see if it has been clicked
            //  and add to selections
            const w = this.designer.getWires().find((w) => BezierContains(w.getShape(), worldMousePos));
            if (w) {
                group.add(new SelectAction(this, w, false));
                this.addSelection(w);
                render = true;
            }

            this.setAction(group);

            return render;
        }

        return false;
    }

    public onKeyDown(input: Input, key: number): boolean {
        // If modifier key and a key are pressed, select all
        if (input.isModifierKeyDown() && key == A_KEY) {
            this.selectAll();
            return true;
        }

        if (this.selections.length == 0)
            return false;

        if (key == DELETE_KEY || key == BACKSPACE_KEY) {
            const allDeletions: SeparatedComponentCollection = GatherGroup(this.selections);
            const components = allDeletions.getAllComponents();
            const wires = allDeletions.wires;

            // Create actions for deletion of wires then objects
            //  order matters because the components need to be added
            //  (when undoing) before the wires can be connected
            const group = new GroupAction();
            group.add(this.selections.map((obj) => new SelectAction(this, obj, true)));
            group.add(wires.map((wire)          => new DeleteWireAction(wire)));
            group.add(components.map((obj)      => new DeleteAction(obj)));

            this.setAction(group);

            // Actually delete the objects/wires
            for (const wire of wires)
                this.designer.removeWire(wire);
            for (const obj of components)
                this.designer.removeObject(obj);

            this.clearSelections();
            return true;
        }
        if (key == ESC_KEY) {
            this.setAction(this.clearSelections());
            return true;
        }

        return false;
    }

    public calculateMidpoint(): Vector {
        let selections = this.selections;
        let midpoint = V();
        for (let obj of selections) {
            if (obj instanceof EEComponent)
                midpoint.translate(obj.getPos());
        }
        return midpoint.scale(1. / selections.length);
    }

    public getAction(): Action {
        const action = this.lastAction;

        // Remove action
        this.lastAction = undefined;

        return action;
    }

    public getSelections(): Array<EEObject> {
        return this.selections.slice(); // shallow copy
    }
    public getPortSelections(): Array<EEPort> {
        return this.portSelections.slice(); // shallow copy
    }
    public isSelecting(): boolean {
        return this.selecting;
    }

    public getP1(): Vector {
        return this.p1.copy();
    }
    public getP2(): Vector {
        return this.p2.copy();
    }

    public addSelectionChangeListener(func: {(): void}) {
        this.callbacks.push(func);
    }
    public getCurrentlyPressedObj(): EEObject {
        return this.currentPressedObj;
    }

}
