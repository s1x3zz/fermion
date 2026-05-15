import type { SolverResult } from '@fermion/solver';
export type SolverStatus = 'idle' | 'running' | 'error';
interface SimState {
    selectedComponentId: string | null;
    selectedWireId: string | null;
    isSimulating: boolean;
    solverStatus: SolverStatus;
    solverError: string | null;
    lastResult: SolverResult | null;
    lastSolveMs: number;
    cursorWorldPos: {
        x: number;
        z: number;
    };
    fps: number;
    selectComponent: (id: string) => void;
    selectWire: (id: string) => void;
    deselect: () => void;
    toggleSimulate: () => void;
    setSolverStatus: (status: SolverStatus, error?: string) => void;
    setLastResult: (result: SolverResult, ms: number) => void;
    updateCursor: (x: number, z: number) => void;
    updateFps: (fps: number) => void;
}
export declare const selectComponent: (id: string) => void, selectWire: (id: string) => void, deselect: () => void, toggleSimulate: () => void, setSolverStatus: (status: SolverStatus, error?: string) => void, setLastResultAction: (result: SolverResult, ms: number) => void, updateCursor: (x: number, z: number) => void, updateFps: (fps: number) => void;
export declare const getSimSnapshot: () => SimState;
export declare function useSimStore(): {
    selectedComponentId: import("solid-js").Accessor<string | null>;
    selectedWireId: import("solid-js").Accessor<string | null>;
    isSimulating: import("solid-js").Accessor<boolean>;
    solverStatus: import("solid-js").Accessor<SolverStatus>;
    solverError: import("solid-js").Accessor<string | null>;
    lastResult: import("solid-js").Accessor<SolverResult | null>;
    lastSolveMs: import("solid-js").Accessor<number>;
    cursorWorldPos: import("solid-js").Accessor<{
        x: number;
        z: number;
    }>;
    fps: import("solid-js").Accessor<number>;
    selectComponent: (id: string) => void;
    selectWire: (id: string) => void;
    deselect: () => void;
    toggleSimulate: () => void;
    setSolverStatus: (status: SolverStatus, error?: string) => void;
    setLastResult: (result: SolverResult, ms: number) => void;
    updateCursor: (x: number, z: number) => void;
    updateFps: (fps: number) => void;
};
export {};
//# sourceMappingURL=simStore.d.ts.map