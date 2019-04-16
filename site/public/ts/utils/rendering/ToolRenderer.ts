import {ROTATION_CIRCLE_RADIUS,
        ROTATION_CIRCLE_THICKNESS} from "../Constants";
import {Vector} from "../math/Vector";
import {Renderer} from "./Renderer";
import {Camera} from "../Camera";
import {ToolManager} from "../tools/ToolManager";
import {SelectionTool} from "../tools/SelectionTool";
import {RotateTool} from "../tools/RotateTool";
import {PlaceComponentTool} from "../tools/PlaceComponentTool";
import {WiringTool} from "../tools/WiringTool";

import {EEComponentRenderer} from "./eeobjects/EEComponentRenderer";
import {EEWireRenderer} from "./eeobjects/EEWireRenderer";
import {EEWire} from "../../models/eeobjects/EEWire";

export const ToolRenderer = (function() {

    const drawRotationCircleOutline = function(renderer: Renderer, camera: Camera, midpoint: Vector): void {
        // Get position, radius, and thickness
        let pos = camera.getScreenPos(midpoint);
        let radius = ROTATION_CIRCLE_RADIUS / camera.getZoom();
        let thickness = ROTATION_CIRCLE_THICKNESS / camera.getZoom();

        renderer.circle(pos.x, pos.y, radius, undefined, '#ff0000', thickness, 0.5);
    }

    const drawRotationCircleArc = function(renderer: Renderer, camera: Camera, midpoint: Vector, a0: number, a1: number): void {
        // Get position, radius, and angles
        const pos = camera.getScreenPos(midpoint);
        const radius = ROTATION_CIRCLE_RADIUS / camera.getZoom();

        // Draw arc'd circle
        renderer.arcCircle(pos.x, pos.y, radius, a0, a1, '#ffffff', '#000000', 5, 0.4);
    }

    return {
        render(renderer: Renderer, camera: Camera, toolManager: ToolManager) {
            const tool = toolManager.getCurrentTool();

            // If a wire has been selected, then don't draw the rotation box
            const selections = toolManager.getSelectionTool().getSelections();
            const hasWire = selections.some((o) => o instanceof EEWire);

            if (tool instanceof SelectionTool) {
                // Draw selection box
                if (tool.isSelecting()) {
                    // Get positions and size
                    const p1 = tool.getP1();
                    const p2 = tool.getP2();
                    const pos = p1.add(p2).scale(0.5);
                    const size = p2.sub(p1);

                    // Draw box
                    renderer.rect(pos.x, pos.y, size.x, size.y, '#ffffff', '#6666ff', 2, 0.4);
                }

                // Draw rotation circle outline
                else if (!hasWire && tool.getSelections().length > 0 && toolManager.hasTool(RotateTool)) {
                    drawRotationCircleOutline(renderer, camera, tool.calculateMidpoint());
                }
            }
            else if (tool instanceof RotateTool) {
                // Draw rotation circle and outline
                if (!hasWire) {
                    drawRotationCircleOutline(renderer, camera, tool.getMidpoint());
                    drawRotationCircleArc(renderer, camera, tool.getMidpoint(), tool.getStartAngle(), tool.getPrevAngle());
                }
            }
            else if (tool instanceof PlaceComponentTool) {
                // Draw current object
                const component = tool.getComponent();

                EEComponentRenderer.render(renderer, camera, component, false, []);
            }
            else if (tool instanceof WiringTool) {
                // Draw fake wire
                const wire = tool.getWire();
                EEWireRenderer.render(renderer, camera, wire, false);
            }

        }
    };
})();
