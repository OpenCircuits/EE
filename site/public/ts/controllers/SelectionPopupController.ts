import {Vector, V} from "../utils/math/Vector";

import {MainDesignerController} from "./MainDesignerController";
import {EEComponent} from "../models/eeobjects/EEComponent";
import {EEWire} from "../models/eeobjects/EEWire";
import {Camera} from "../utils/Camera";

import {SelectionPopupModule} from "../utils/selectionpopup/SelectionPopupModule";
import {TitlePopupModule} from "../utils/selectionpopup/TitlePopupModule";
import {PositionPopupModule} from "../utils/selectionpopup/PositionPopupModule";
import {BusButtonPopupModule} from "../utils/selectionpopup/BusButtonPopupModule";

/**
* A popup that exposes certain properties of the selected components to the user
* ! Controls its own DOM element(s)
* TODO: use decorators or some other interface to determine what properties are available
*/
export const SelectionPopupController = (function() {
    let camera: Camera;
    let div: HTMLDivElement;
    let modules: Array<SelectionPopupModule>;
    let pos: Vector;

    const setPos = function(v: Vector): void {
        pos = v;

        div.style.left = `${pos.x}px`;
        div.style.top  = `${pos.y}px`;
    }

    return {
        Init: function(cam: Camera, div_id: string = "popup"): void {
            camera = cam;

            div = document.getElementById(div_id) as HTMLDivElement;
            // ? .js sets position to "absolute" -- why? Why not set in the css file

            modules = new Array<SelectionPopupModule>(
                new TitlePopupModule(div),
                new PositionPopupModule(div),
                new BusButtonPopupModule(div)
            );
            pos = V(0, 0);
        },
        Update: function(): void {
            const selections = <Array<EEComponent | EEWire>>MainDesignerController.GetSelections();
            const portSelections = MainDesignerController.GetPortSelections();

            if (selections.length > 0 || portSelections.length > 0) {
                // Update each module
                // Important to do this before repositioning the popup, since its size changes depending on which modules are active
                modules.forEach(c => c.pull());

                // Update the position of the popup
                let positions;
                if (selections.length > 0)
                    positions = selections.map(o => (o instanceof EEComponent) ? o.getPos() : o.getShape().getPos(0.5));
                else
                    positions = portSelections.map(p => p.getWorldTargetPos());

                const sum = positions.reduce((acc, pos) => acc.add(pos), V(0, 0));
                const screen_pos = camera.getScreenPos(sum.scale(1/positions.length)).sub(0, div.clientHeight/2);

                // TODO: clamp should make sure not to overlap with other screen elements
                //const lo = new Vector(0);
                //const hi = new Vector(document.body.clientWidth, document.body.clientHeight);

                setPos(screen_pos);// Vector.clamp(screen_pos, lo, hi);

                this.Show();
            } else {
                this.Hide();
            }
        },
        Show: function(): void {
            div.style.visibility = "visible";
            div.focus();
        },
        Hide: function(): void {
            div.style.visibility = "hidden";
        }
    };
})();
