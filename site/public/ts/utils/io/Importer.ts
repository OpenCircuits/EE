import {XMLReader} from "./xml/XMLReader";
import {XMLNode} from "./xml/XMLNode";
import {EECircuitDesigner} from "../../models/EECircuitDesigner";

export const Importer = (function() {
    let saved = false;

    const read = function(designer: EECircuitDesigner, file: string, setName: (n: string) => void): void {
        let root = <XMLDocument>new DOMParser().parseFromString(file, "text/xml");
        if (root.documentElement.nodeName == "parsererror")
            return;

        let reader = new XMLReader(root);

        setName(reader.getName());

        designer.load(reader.getRoot());
    }

    return {
        loadFile: function(designer: EECircuitDesigner, file: File, setName: (n: string) => void): void {
            // TOOD: only ask for confirmation if nothing was done to the scene
            //        ex. no objects, or wires, or history of actions
            let open = confirm("Are you sure you want to overwrite your current scene?");

            if (open) {
                designer.reset();

                let reader = new FileReader();
                reader.onload = function(e) {
                    read(designer, reader.result.toString(), setName);
                }

                reader.readAsText(file);
            }
        }
    }

})();
