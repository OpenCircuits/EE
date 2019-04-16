import {Camera}              from "../utils/Camera";
import {Renderer}            from "../utils/rendering/Renderer";
import {Grid}                from "../utils/rendering/Grid";
import {ToolRenderer}        from "../utils/rendering/ToolRenderer";
import {EEWireRenderer}      from "../utils/rendering/eeobjects/EEWireRenderer";
import {EEComponentRenderer} from "../utils/rendering/eeobjects/EEComponentRenderer";

import {ToolManager} from "../utils/tools/ToolManager";

import {EECircuitDesigner} from "../models/EeCircuitDesigner";

import {EEObject}  from "../models/eeobjects/EEObject";
import {EEPort} from "../models/eeobjects/EEPort";

export class MainDesignerView {
    private canvas: HTMLCanvasElement;
    private renderer: Renderer;
    private camera: Camera;

    public constructor() {
        const canvas = document.getElementById("canvas");
        if (!(canvas instanceof HTMLCanvasElement))
            throw new Error("Canvas element not found!");
        this.canvas = canvas;
        this.renderer = new Renderer(this.canvas);
        this.camera = new Camera(this.canvas.width, this.canvas.height);

        this.resize();
    }

    public render(designer: EECircuitDesigner, selections: Array<EEObject>, portSelections: Array<EEPort>, toolManager: ToolManager) {
        this.renderer.clear();

        // Render grid
        Grid.render(this.renderer, this.camera);

        // Render all wires (first so they are underneath objects)
        const wires = designer.getWires();
        for (let wire of wires) {
            const selected = selections.includes(wire);
            EEWireRenderer.render(this.renderer, this.camera, wire, selected);
        }

        // Render all objects
        const objects = designer.getObjects();
        for (let object of objects) {
            const selected = selections.includes(object);
            EEComponentRenderer.render(this.renderer, this.camera, object, selected, portSelections);
        }

        // Render current tool
        ToolRenderer.render(this.renderer, this.camera, toolManager);
    }

    public resize(): void {
        this.renderer.resize();
        this.camera.resize(this.canvas.width, this.canvas.height);
    }

    public getCanvas(): HTMLCanvasElement {
        return this.canvas;
    }
    public getCamera(): Camera {
        return this.camera;
    }
}
