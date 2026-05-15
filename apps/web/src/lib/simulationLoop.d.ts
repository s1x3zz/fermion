import type { PlacedComponent, PlacedWire } from '@fermion/core';
export interface SimLoopCallbacks {
    getComponents: () => Record<string, PlacedComponent>;
    getWires: () => Record<string, PlacedWire>;
    onWireCurrentUpdate: (wireId: string, current: number) => void;
    onComponentGlow: (compId: string, isOn: boolean, current: number) => void;
}
export declare function startSimulationLoop(callbacks: SimLoopCallbacks): void;
export declare function stopSimulationLoop(): void;
//# sourceMappingURL=simulationLoop.d.ts.map