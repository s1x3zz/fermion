import type { ComponentType } from '@fermion/core';
interface CircuitAPI {
    addComponent: (type: ComponentType, row: string, col: number) => string;
    addWire: (pinA: {
        row: string;
        col: number;
    }, pinB: {
        row: string;
        col: number;
    }, signalType?: string) => string;
}
/**
 * Loads a minimal test circuit:
 *   Battery 9V → VCC rail → 330Ω resistor → LED (red) → GND rail
 *
 * Only call in DEV mode with ?test=1.
 */
export declare function loadTestCircuit(circuit: CircuitAPI): void;
export {};
//# sourceMappingURL=devTestCircuit.d.ts.map