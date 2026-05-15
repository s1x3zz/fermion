import { BreadboardCircuitSchema } from './schemas';
export const CURRENT_VERSION = '0.1.0';
export function serializeCircuit(components, wires) {
    return {
        components: Object.values(components),
        wires: Object.values(wires),
    };
}
export function deserializeCircuit(circuit) {
    const comps = {};
    for (const c of circuit.components)
        comps[c.id] = c;
    const ws = {};
    for (const w of circuit.wires)
        ws[w.id] = w;
    return { components: comps, wires: ws };
}
export function validateCircuit(data) {
    return BreadboardCircuitSchema.parse(data);
}
export function makeCircuitSnapshot(components, wires) {
    const circuit = serializeCircuit(components, wires);
    return {
        version: CURRENT_VERSION,
        savedAt: Date.now(),
        circuit,
        metadata: {
            componentCount: circuit.components.length,
            wireCount: circuit.wires.length,
            simulatorVersion: CURRENT_VERSION,
        },
    };
}
//# sourceMappingURL=serialization.js.map