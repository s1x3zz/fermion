import type { PlacedComponent, PlacedWire } from '@fermion/core';
export declare function onAvrStateUpdate(cb: (states: any, arduinos: string[]) => void): void;
export declare function startAvrCircuitBridge(): void;
export declare function stopAvrCircuitBridge(): void;
export declare function injectAvrComponents(components: Record<string, PlacedComponent>, wires: Record<string, PlacedWire>): {
    components: Record<string, PlacedComponent>;
    wires: Record<string, PlacedWire>;
};
//# sourceMappingURL=avrCircuitBridge.d.ts.map