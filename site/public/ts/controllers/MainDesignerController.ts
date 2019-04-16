import {Camera} from "../utils/Camera";
import {Input} from "../utils/Input";
import {RenderQueue} from "../utils/RenderQueue";

import {Action} from "../utils/actions/Action";

import {EECircuitDesigner} from "../models/EECircuitDesigner";

import {MainDesignerView} from "../views/MainDesignerView";

import {ToolManager} from "../utils/tools/ToolManager";
import {TranslateTool} from "../utils/tools/TranslateTool";
import {RotateTool} from "../utils/tools/RotateTool";
import {PlaceComponentTool} from "../utils/tools/PlaceComponentTool";
import {WiringTool} from "../utils/tools/WiringTool";

import {EEObject} from "../models/eeobjects/EEObject";
import {EEComponent} from "../models/eeobjects/EEComponent";
import {EEPort} from "../models/eeobjects/EEPort";
import {SelectionPopupController} from "./SelectionPopupController";

export const MainDesignerController = (function() {
    let designer: EECircuitDesigner;
    let view: MainDesignerView;
    let input: Input;

    let toolManager: ToolManager;
    let renderQueue: RenderQueue;

    const playButton = document.getElementById("simulate-button");

    const resize = function() {
        view.resize();

        MainDesignerController.Render();
    }

    const onMouseDown = function(button: number): void {
        if (toolManager.onMouseDown(input, button))
            MainDesignerController.Render();
    }

    const onMouseMove = function(): void {
        if (toolManager.onMouseMove(input))
            MainDesignerController.Render();
    }

    const onMouseDrag = function(button: number): void {
        if (toolManager.onMouseDrag(input, button)) {
            SelectionPopupController.Hide();
            MainDesignerController.Render();
        }
    }

    const onMouseUp = function(button: number): void {
        if (toolManager.onMouseUp(input, button)) {
            SelectionPopupController.Update();
            MainDesignerController.Render();
        }
    }

    const onClick = function(button: number): void {
        if (toolManager.onClick(input, button)){
            SelectionPopupController.Update();
            MainDesignerController.Render();
        }
    }

    const onKeyDown = function(key: number): void {
        if (toolManager.onKeyDown(input, key))
            MainDesignerController.Render();
    }

    const onKeyUp = function(key: number): void {
        if (toolManager.onKeyUp(input, key))
            MainDesignerController.Render();
    }

    const onScroll = function(): void {
        // @TODO move this stuff as well
        let zoomFactor = input.getZoomFactor();

        // Calculate position to zoom in/out of
        let pos0 = view.getCamera().getWorldPos(input.getMousePos());
        view.getCamera().zoomBy(zoomFactor);
        let pos1 = view.getCamera().getScreenPos(pos0);
        let dPos = pos1.sub(input.getMousePos());
        view.getCamera().translate(dPos.scale(view.getCamera().getZoom()));

        SelectionPopupController.Update();
        MainDesignerController.Render();
    }

    return {
        Init: function(): void {
            // pass Render function so that
            //  the circuit is redrawn every
            //  time its updated
            designer = new EECircuitDesigner(() => this.Render());
            view = new MainDesignerView();

            // utils
            toolManager = new ToolManager(view.getCamera(), designer);
            renderQueue = new RenderQueue(() =>
                view.render(designer,
                            toolManager.getSelectionTool().getSelections(),
                            toolManager.getSelectionTool().getPortSelections(),
                            toolManager));

            playButton.onclick = () => {
                designer.simulate();
                MainDesignerController.Render();
            }

            // input
            input = new Input(view.getCanvas());
            input.addListener("click",     (b) => onClick(b));
            input.addListener("mousedown", (b) => onMouseDown(b));
            input.addListener("mousedrag", (b) => onMouseDrag(b));
            input.addListener("mousemove", ( ) => onMouseMove());
            input.addListener("mouseup",   (b) => onMouseUp(b));
            input.addListener("keydown",   (b) => onKeyDown(b));
            input.addListener("keyup",     (b) => onKeyUp(b));
            input.addListener("scroll", onScroll);

            window.addEventListener("resize", _e => resize(), false);

            toolManager.getSelectionTool().addSelectionChangeListener( () => SelectionPopupController.Update() );
        },
        Render: function(): void {
            renderQueue.render();
        },
        ClearSelections: function(): void {
            toolManager.getSelectionTool().clearSelections();
        },
        PlaceComponent: function(component: EEComponent, instant: boolean = false): void {
            toolManager.placeComponent(component, instant);
        },
        AddAction: function(action: Action) {
            toolManager.addAction(action);
        },
        SetEditMode: function(val: boolean): void {
            // Disable some tools
            toolManager.disableTool(TranslateTool, val);
            toolManager.disableTool(RotateTool, val);
            toolManager.disableTool(PlaceComponentTool, val);
            toolManager.disableTool(WiringTool, val);

            // Disable actions/selections
            toolManager.disableActions(val);
            toolManager.getSelectionTool().clearSelections();
            toolManager.getSelectionTool().disableSelections(val);

            MainDesignerController.Render();
        },
        GetSelections: function(): Array<EEObject> {
            return toolManager.getSelectionTool().getSelections();
        },
        GetPortSelections: function(): Array<EEPort> {
            return toolManager.getSelectionTool().getPortSelections();
        },
        GetCanvas: function(): HTMLCanvasElement {
            return view.getCanvas();
        },
        GetCamera: function(): Camera {
            return view.getCamera();
        },
        GetDesigner: function(): EECircuitDesigner {
            return designer;
        }
    };
})();
