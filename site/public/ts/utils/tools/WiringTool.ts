import {IO_PORT_RADIUS} from "../Constants";
import {Tool} from "./Tool";
import {EECircuitDesigner} from "../../models/EECircuitDesigner";
import {EEPort} from "../../models/eeobjects/EEPort";
import {InputPort} from "../../models/eeobjects/InputPort";
import {OutputPort} from "../../models/eeobjects/OutputPort";
import {EEWire} from "../../models/eeobjects/EEWire";

import {CircleContains} from "../math/MathUtils";

import {SelectionTool} from "./SelectionTool";

import {Input} from "../Input";
import {Camera} from "../Camera";

import {Action} from "../actions/Action";
import {ConnectionAction} from "../actions/ConnectionAction";

export class WiringTool extends Tool {

    private designer: EECircuitDesigner;
    private camera: Camera;

    private port: EEPort;

    private wire: EEWire;

    // Keep track of whether or not this tool was
    //  activated by dragging or clicking
    private clicked: boolean;

    public constructor(designer: EECircuitDesigner, camera: Camera) {
        super();

        this.designer = designer;
        this.camera = camera;
    }

    public activate(currentTool: Tool, event: string, input: Input, button?: number): boolean {
        if (!(currentTool instanceof SelectionTool))
            return false;
        if (!(event == "mousedown" || event == "onclick"))
            return false;

        let worldMousePos = this.camera.getWorldPos(input.getMousePos());

        let objects = this.designer.getObjects();
        for (let i = objects.length-1; i >= 0; i--) {
            let obj = objects[i];
            // Check if a port was clicked
            for (let p of obj.getPorts()) {
                if (CircleContains(p.getWorldTargetPos(), IO_PORT_RADIUS, worldMousePos)) {
                    // Input ports can only have one input
                    // so if one was clicked, then don't
                    // start a new wire
                    if (p instanceof InputPort &&
                        p.getInput() != null)
                        return false;

                    // Activate
                    this.clicked = (event == "onclick");

                    this.port = p;

                    // Create wire
                    if (p instanceof InputPort) {
                        this.wire = new EEWire(null, p);
                        this.wire.getShape().setP1(p.getWorldTargetPos());
                        this.wire.getShape().setC1(p.getWorldTargetPos());
                    }
                    if (p instanceof OutputPort) {
                        this.wire = new EEWire(p, null);
                        this.wire.getShape().setP2(p.getWorldTargetPos());
                        this.wire.getShape().setC2(p.getWorldTargetPos());
                    }

                    return true;
                }
            }
        }
        return false;
    }

    public deactivate(event: string, input: Input, button?: number): boolean {
        if (this.clicked  && event == "onclick")
            return true;
        if (!this.clicked && event == "mouseup")
            return true;
        return false;
    }

    public onMouseMove(input: Input): boolean {
        let worldMousePos = this.camera.getWorldPos(input.getMousePos());

        // Set one side of curve to mouse position
        let shape = this.wire.getShape();
        if (this.port instanceof InputPort) {
            shape.setP1(worldMousePos);
            shape.setC1(worldMousePos);
        }
        if (this.port instanceof OutputPort) {
            shape.setP2(worldMousePos);
            shape.setC2(worldMousePos);
        }

        return true;
    }

    public onMouseUp(input: Input, button: number): boolean {
        let worldMousePos = this.camera.getWorldPos(input.getMousePos());

        let objects = this.designer.getObjects();
        for (let i = objects.length-1; i >= 0; i--) {
            let obj = objects[i];

            // Check if a port was clicked
            for (let p of obj.getPorts()) {
                if (CircleContains(p.getWorldTargetPos(), IO_PORT_RADIUS, worldMousePos)) {
                    // Connect ports
                    if (this.port instanceof InputPort && p instanceof OutputPort)
                        this.wire = this.designer.createWire(p, this.port);

                    // Connect ports if not already connected
                    if (this.port instanceof OutputPort && p instanceof InputPort) {
                        // Input ports can only have one input
                        //  so don't connect if it already has one
                        if (p.getInput() != null)
                            return true;

                        this.wire = this.designer.createWire(this.port, p);
                    }

                    return true;
                }
            }
        }

        return true;
    }

    public getAction(): Action {
        if (this.wire.getInput() == undefined || this.wire.getOutput() == undefined)
            return undefined;

        return new ConnectionAction(this.wire);
    }

    public getWire(): EEWire {
        return this.wire;
    }

}
