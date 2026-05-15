export interface ResistorElement {
    type: 'R';
    id: string;
    nodeA: number;
    nodeB: number;
    value: number;
}
export interface VoltageElement {
    type: 'V';
    id: string;
    nodePos: number;
    nodeNeg: number;
    value: number;
}
export interface DiodeElement {
    type: 'D';
    id: string;
    nodeA: number;
    nodeK: number;
    Is: number;
    n: number;
    Vt: number;
    Vf_clamp: number;
}
export type SolverElement = ResistorElement | VoltageElement | DiodeElement;
export interface Netlist {
    nodeCount: number;
    elements: SolverElement[];
}
export interface SolverResult {
    nodeVoltages: number[];
    branchCurrents: Record<string, number>;
    converged: boolean;
    iterations: number;
}
export interface PlainComponent {
    id: string;
    type: string;
    position: {
        row: string;
        col: number;
    };
    value?: number | undefined;
}
export interface PlainWire {
    id: string;
    pinA: {
        row: string;
        col: number;
    };
    pinB: {
        row: string;
        col: number;
    };
}
export interface NetlistInput {
    components: PlainComponent[];
    wires: PlainWire[];
}
export declare class NetlistBuilder {
    build(input: NetlistInput): {
        netlist: Netlist;
        pinToNode: Map<string, number>;
    };
}
export declare class MNASolver {
    solve(netlist: Netlist): SolverResult;
}
//# sourceMappingURL=MNASolver.d.ts.map