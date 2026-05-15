import type { PlacedComponent, PlacedWire, BreadboardCircuit } from './types/components';
export declare const CURRENT_VERSION = "0.1.0";
export interface CircuitSnapshot {
    version: string;
    savedAt: number;
    circuit: BreadboardCircuit;
    metadata: {
        componentCount: number;
        wireCount: number;
        simulatorVersion: string;
    };
}
export declare function serializeCircuit(components: Record<string, PlacedComponent>, wires: Record<string, PlacedWire>): BreadboardCircuit;
export declare function deserializeCircuit(circuit: BreadboardCircuit): {
    components: Record<string, PlacedComponent>;
    wires: Record<string, PlacedWire>;
};
export declare function validateCircuit(data: unknown): BreadboardCircuit;
export declare function makeCircuitSnapshot(components: Record<string, PlacedComponent>, wires: Record<string, PlacedWire>): CircuitSnapshot;
//# sourceMappingURL=serialization.d.ts.map