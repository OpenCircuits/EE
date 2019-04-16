import {CreateComponentFromXML} from "./ComponentFactory";

import {Graph} from "./math/Graph";

import {XMLNode} from "./io/xml/XMLNode";

import {EEObject} from "../models/eeobjects/EEObject";
import {EEComponent} from "../models/eeobjects/EEComponent";

import {InputPort} from "../models/eeobjects/InputPort";
import {OutputPort} from "../models/eeobjects/OutputPort";
import {EEWire} from "../models/eeobjects/EEWire";

import {Node} from "../models/eeobjects/Node";

/**
 * Helper class to hold different groups of components.
 *
 * The groups are:
 *  Input components  (anything with 0 output ports and >0  input ports)
 *  Output components (anything with 0 input ports  and >0 output ports)
 *  Wires             (wires)
 *  Components        (anything else)
 *
 * Note that .components does NOT contain inputs and outputs
 *  A helper method to get all the components including them
 *  is included as getAllComponents()
 */
export class SeparatedComponentCollection {
    public inputs: Array<EEComponent>;
    public components: Array<EEComponent>;
    public outputs: Array<EEComponent>;
    public wires: Array<EEWire>;

    public constructor() {
        this.inputs = new Array<EEComponent>();
        this.components = new Array<EEComponent>();
        this.outputs = new Array<EEComponent>();
        this.wires = new Array<EEWire>();
    }

    public getAllComponents(): Array<EEComponent> {
        return this.inputs.concat(this.components, this.outputs);
    }
}

/**
 * Helper method to create and connect a EEWire between two Ports
 *
 * @param  p1 The output port
 * @param  p2 The input port (must not have a connection already)
 * @return    The new EEWire connecting the two ports
 */
export function CreateWire(p1: OutputPort, p2: InputPort): EEWire {
    if (p2.getInput() != undefined)
        throw new Error("Cannot create EEWire! Input port already has an input!");

    // Make EEWire
    let wire = new EEWire(p1, p2);

    // Connect ports to EEWire
    p1.connect(wire);
    p2.setInput(wire);

    return wire;
}

/**
 * Helper function to connect two components at the given
 *  port indices
 *
 * @param  c1 The "output" EEComponent
 * @param  i1 The index relating to the output ports of c1
 * @param  c2 The "input" EEComponent
 * @param  i2 The index relating to the input ports of c2
 * @return    The EEWire connecting the two components
 */
export function Connect(c1: EEComponent, i1: number, c2: EEComponent, i2: number): EEWire {
    return CreateWire(c1.getOutputPort(i1), c2.getInputPort(i2));
}

/**
 * Gathers all the wires that connect the given
 *  components
 *
 * @param  objs The array of components
 * @return      An array of connections
 */
export function GetAllWires(objs: Array<EEComponent>): Array<EEWire> {
    let allWires = new Array<EEWire>();

    // Gather all wires that attach objects in the given array
    for (let obj of objs) {
        let wires = obj.getOutputs();
        for (let EEWire of wires) {
            // Make sure connection is in the array
            if (objs.includes(EEWire.getOutputComponent()))
                allWires.push(EEWire);
        }
    }

    return allWires;
}

/**
 * Helper method to separate out a group of eeobjects
 *  into a SeparatedComponentCollection class
 *
 * @param  objects The array of objects to sort through
 *                  Must contain valid, defined eeobjects
 * @return         A SeparatedComponentCollection of the
 *                  objects
 */
export function SeparateGroup(objects: Array<EEObject>): SeparatedComponentCollection {
    // Initial group
    let groups = new SeparatedComponentCollection();

    // Sort out each type of object into separate groups
    for (let obj of objects) {
        if (obj instanceof EEWire) {
            groups.wires.push(obj);
        } else if (obj instanceof EEComponent) {
            // Input => >0 output ports and 0 input ports
            if (obj.getInputPortCount() == 0 && obj.getOutputPortCount() > 0)
                groups.inputs.push(obj);
            // Output => >0 input ports and 0 output ports
            else if (obj.getInputPortCount() > 0 && obj.getOutputPortCount() == 0)
                groups.outputs.push(obj);
            // EEComponent => neither just input or output
            else
                groups.components.push(obj);
        } else {
            throw new Error("Unknown type: " + obj + " in SeparateGroup.");
        }
    }

    return groups;
}

/**
 * Creates a Separated group from the given list of objects
 *  It differs from SeparateGroup by also retrieving all IMMEDIATELY
 *   connected wires that connect to other objects in `objects`
 *
 * Note that this method assumes all the components you want in the group are
 *  provided in `objects` INCLUDING WirePorts, this will not trace down the paths
 *  to get all wires ports. Use GatherGroup(objects) to do this.
 *
 * @param  objects The list of objects to separate
 * @return         A SeparatedComponentCollection of the objects
 */
export function CreateGroup(objects: Array<EEObject>): SeparatedComponentCollection {
    let group = SeparateGroup(objects);

    // Gather all connecting wires
    const objs = group.getAllComponents();
    for (const obj of objs) {
        // Only get wires that connect to other components in objects
        group.wires = group.wires.concat(
                            obj.getOutputs().filter((w) => objs.includes(w.getOutputComponent())));
    }

    return group;
}

/**
 * Get's all the wires/WirePorts going out from this wire
 *
 * @param  w The wire to start from
 * @return   The array of wires/WirePorts in this path (incuding w)
 */
export function GetPath(w: EEWire): Array<EEWire | Node> {
    let path: Array<EEWire | Node> = [];

    // Go to beginning of path
    let i = w.getInputComponent();
    while (i instanceof Node) {
        w = i.getInputs()[0];
        i = w.getInputComponent();
    }

    path.push(w);

    // Outputs
    let o = w.getOutputComponent();
    while (o instanceof Node) {
        // Push the wireport and next wire
        path.push(o);
        path.push(w = o.getOutputs()[0]);
        o = w.getOutputComponent();
    }

    return path;
}

/**
 * Gathers all wires + wireports in the path from the inputs/outputs
 *  of the given component.
 *
 * @param  obj  The component
 * @return      An array of connections + WirePorts
 */
export function GetAllPaths(obj: EEComponent): Array<EEWire | Node> {
    let path: Array<EEWire | Node> = [];

    // Get all paths
    let wires = new Set(obj.getInputs().concat(obj.getOutputs()));
    for (const wire of wires)
        path = path.concat(GetPath(wire).filter((o) => !path.includes(o)));

    return path;
}

/**
 * Creates a Separated group from the given list of objects.
 *  It also retrieves all "paths" going out from each object.
 *
 * @param  objects The list of objects
 * @return         A SeparatedComponentCollection of the objects
 */
export function GatherGroup(objects: Array<EEObject>): SeparatedComponentCollection {
    let group = SeparateGroup(objects);

    // Gather all connecting paths
    for (const obj of objects) {
        const path = (obj instanceof EEWire ? GetPath(obj) : GetAllPaths(<EEComponent>obj));

        // Add wires and wireports
        group.wires      = group.wires.concat(
                                <Array<EEWire>>path.filter((o) => o instanceof EEWire && !group.wires.includes(o)));
        group.components = group.components.concat(
                                <Array<Node>>  path.filter((o) => o instanceof Node   && !group.components.includes(o)))
    }

    return group;
}

/**
 * Helper function to create a directed graph from a given
 *  collection of components
 *
 * The Graph stores Nodes as indices from the
 * groups.getAllComponents() array
 *
 * The edge weights are stored as pairs representing
 * the input index (i1) and the output index (i2) respectively
 *
 * @param  groups The SeparatedComponentCollection of components
 * @return        A graph corresponding to the given circuit
 */
export function CreateGraph(groups: SeparatedComponentCollection): Graph<number, {i1:number, i2:number}> {
    let graph = new Graph<number, {i1:number, i2:number}>();

    let objs = groups.getAllComponents();
    let map = new Map<EEComponent, number>();

    // Create nodes and map
    for (let i = 0; i < objs.length; i++) {
        graph.createNode(i);
        map.set(objs[i], i);
    }

    // Create edges
    for (let j = 0; j < groups.wires.length; j++) {
        let wire = groups.wires[j];
        let c1 = map.get(wire.getInputComponent());
        let c2 = map.get(wire.getOutputComponent());
        let i1 = wire.getInputComponent().getOutputPorts().indexOf(wire.getInput());
        let i2 = wire.getOutputComponent().getInputPorts().indexOf(wire.getOutput());
        let indices = {i1: i1, i2: i2};
        graph.createEdge(c1, c2, indices);
    }

    return graph;
}

/**
 * Copies a group of objects including connections that are
 *  present within the objects
 *
 * @param  objects [description]
 * @return         [description]
 */
export function CopyGroup(objects: Array<EEObject> | SeparatedComponentCollection): SeparatedComponentCollection {
    // Separate out the given objects
    let groups = (objects instanceof SeparatedComponentCollection) ? (objects) : (CreateGroup(objects));
    let objs = groups.getAllComponents();

    let graph: Graph<number, {i1:number, i2:number}> = CreateGraph(groups);

    // Copy components
    let copies: Array<EEComponent> = [];
    for (let i = 0; i < objs.length; i++)
        copies.push(objs[i].copy());


    // Copy connections
    let wireCopies: Array<EEWire> = [];
    for (let i of graph.getNodes()) {
        let c1 = copies[i];
        let connections = graph.getConnections(i);

        for (let connection of connections) {
            let j = connection.getTarget();
            let indices = connection.getWeight();
            let c2 = copies[j];

            let wire = Connect(c1, indices.i1,  c2, indices.i2);
            wireCopies.push(wire);
        }
    }

    let group: Array<EEObject> = copies;
    return SeparateGroup(group.concat(wireCopies));
}

/**
 * Saves a group of objects to an XML node
 *
 * @param node    The XML parent node
 * @param objects The array of components to save
 * @param wires   The array of wires to save
 * @param icIdMap Map of ICData to unique ids.
 *                Must be created prior to calling this method
 *                  to ensure nested ICs work properly
 */
export function SaveGroup(node: XMLNode, objects: Array<EEComponent>, wires: Array<EEWire>): void {
    let objectsNode = node.createChild("objects");
    let wiresNode   = node.createChild("wires");
    let idMap = new Map<EEObject, number>();
    let id = 0;

    // Save components
    for (let obj of objects) {
        let componentNode = objectsNode.createChild(obj.getXMLName());

        // Set and save XML ID for connections
        componentNode.addAttribute("uid", id);
        idMap.set(obj, id++);

        // Save properties
        obj.save(componentNode);
    }

    // Save wires
    for (let wire of wires) {
        let wireNode = wiresNode.createChild(wire.getXMLName());

        // Save properties
        wire.save(wireNode);

        let inputNode = wireNode.createChild("input");
        {
            let iPort = wire.getInput();
            let input = iPort.getParent();
            let iI = 0;
            // Find index of port
            while (iI < input.getOutputPortCount() &&
                   input.getOutputPort(iI) !== iPort) { iI++; }
            inputNode.addAttribute("uid", idMap.get(input));
            inputNode.addAttribute("index", iI);
        }
        let outputNode = wireNode.createChild("output");
        {
            let oPort = wire.getOutput();
            let input = oPort.getParent();
            let iO = 0;
            // Find index of port
            while (iO < input.getInputPortCount() &&
                   input.getInputPort(iO) !== oPort) { iO++; }
            outputNode.addAttribute("uid", idMap.get(input));
            outputNode.addAttribute("index", iO);
        }
    }
}

/**
 * Load a group of objects from an XML node
 *
 * @param node    The XML parent node
 * @param icIdMap Map of unique ids for ICData.
 *                Must be created prior to calling this method
 *                  to ensure nested ICs work properly
 */
export function LoadGroup(node: XMLNode): SeparatedComponentCollection {
    let objectsNode = node.findChild("objects");
    let wiresNode   = node.findChild("wires");
    let idMap = new Map<number, EEComponent>();

    let objects: Array<EEObject> = [];
    let wires: Array<EEWire> = [];

    // Load components
    let objectNodes = objectsNode.getChildren();
    for (let object of objectNodes) {
        let uid = object.getIntAttribute("uid");

        // Create and add object
        const obj = CreateComponentFromXML(object.getTag());

        if (!obj)
            throw new Error("Cannot find component with tag " + object.getTag() + "!");

        objects.push(obj);

        // Add to ID map for connections later
        idMap.set(uid, obj);

        // Load properties
        obj.load(object);
    }

    // Load wires
    let wireNodes = wiresNode.getChildren();
    for (let wire of wireNodes) {
        let inputNode  = wire.findChild("input");
        let outputNode = wire.findChild("output");

        // Load connections
        let inputObj  = idMap.get( inputNode.getIntAttribute("uid"));
        let outputObj = idMap.get(outputNode.getIntAttribute("uid"));
        let inputIndex  =  inputNode.getIntAttribute("index");
        let outputIndex = outputNode.getIntAttribute("index");

        // Create wire
        let w = Connect(inputObj, inputIndex,  outputObj, outputIndex);
        wires.push(w);

        // Load properties
        w.load(wire);
    }

    return SeparateGroup(objects.concat(wires));
}
