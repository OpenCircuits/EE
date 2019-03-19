import {Graph} from "./math/Graph";

import {EEComponent} from "../models/eeobjects/EEComponent";

import {InputPort} from "../models/eeobjects/InputPort";
import {OutputPort} from "../models/eeobjects/OutputPort";
import {EEWire} from "../models/eeobjects/EEWire";

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
export function CreateGraph(components: Array<EEComponent>): Graph<number, {i1:number, i2:number}> {
    let graph = new Graph<number, {i1:number, i2:number}>();

    let objs = components;
    let wires = GetAllWires(components);
    let map = new Map<EEComponent, number>();

    // Create nodes and map
    for (let i = 0; i < objs.length; i++) {
        graph.createNode(i);
        map.set(objs[i], i);
    }

    // Create edges
    for (let j = 0; j < wires.length; j++) {
        let wire = wires[j];
        let c1 = map.get(wire.getInputComponent());
        let c2 = map.get(wire.getOutputComponent());
        let i1 = wire.getInputComponent().getOutputPorts().indexOf(wire.getInput());
        let i2 = wire.getOutputComponent().getInputPorts().indexOf(wire.getOutput());
        let indices = {i1: i1, i2: i2};
        graph.createEdge(c1, c2, indices);
    }

    return graph;
}
