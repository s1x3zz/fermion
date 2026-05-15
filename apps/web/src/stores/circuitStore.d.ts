import type { ComponentType, PlacedComponent, PinPosition, PlacedWire } from '@fermion/core';
interface CircuitState {
    components: Record<string, PlacedComponent>;
    wires: Record<string, PlacedWire>;
    addComponent: (type: ComponentType, row: string, col: number, rotation?: 0 | 90 | 180 | 270) => string;
    removeComponent: (id: string) => void;
    updateComponent: (id: string, patch: Partial<PlacedComponent>) => void;
    isOccupied: (row: string, col: number) => boolean;
    getOccupiedPins: () => Set<string>;
    getComponent: (id: string) => PlacedComponent | undefined;
    addWire: (pinA: PinPosition, pinB: PinPosition, signalType?: string) => string;
    removeWire: (id: string) => void;
    updateWire: (id: string, patch: Partial<Omit<PlacedWire, 'id'>>) => void;
    getWiresForPin: (row: string, col: number) => PlacedWire[];
    resetCircuit: () => void;
    loadFromData: (components: Record<string, PlacedComponent>, wires: Record<string, PlacedWire>) => void;
}
export declare function subscribeToCircuit(listener: () => void): () => void;
export declare function useCircuitStore(): {
    components: import("solid-js").Accessor<Record<string, PlacedComponent>>;
    wires: import("solid-js").Accessor<Record<string, PlacedWire>>;
    componentCount: import("solid-js").Accessor<number>;
    wireCount: import("solid-js").Accessor<number>;
    addComponent: (type: ComponentType, row: string, col: number, rotation?: 0 | 90 | 180 | 270) => string;
    removeComponent: (id: string) => void;
    updateComponent: (id: string, patch: Partial<PlacedComponent>) => void;
    isOccupied: (row: string, col: number) => boolean;
    getOccupiedPins: () => Set<string>;
    getComponent: (id: string) => PlacedComponent | undefined;
    addWire: (pinA: PinPosition, pinB: PinPosition, signalType?: string) => string;
    removeWire: (id: string) => void;
    updateWire: (id: string, patch: Partial<Omit<PlacedWire, "id">>) => void;
    getWiresForPin: (row: string, col: number) => PlacedWire[];
    resetCircuit: () => void;
    loadFromData: (components: Record<string, PlacedComponent>, wires: Record<string, PlacedWire>) => void;
};
export declare function getCircuitSnapshot(): CircuitState;
export {};
//# sourceMappingURL=circuitStore.d.ts.map