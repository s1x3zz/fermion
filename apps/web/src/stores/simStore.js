import { createSignal } from 'solid-js';
import { createStore } from 'zustand/vanilla';
const _store = createStore()((set) => ({
    selectedComponentId: null,
    selectedWireId: null,
    isSimulating: false,
    solverStatus: 'idle',
    solverError: null,
    lastResult: null,
    lastSolveMs: 0,
    cursorWorldPos: { x: 0, z: 0 },
    fps: 0,
    selectComponent: (id) => set({ selectedComponentId: id, selectedWireId: null }),
    selectWire: (id) => set({ selectedWireId: id, selectedComponentId: null }),
    deselect: () => set({ selectedComponentId: null, selectedWireId: null }),
    toggleSimulate: () => set((s) => ({
        isSimulating: !s.isSimulating,
        solverStatus: !s.isSimulating ? 'running' : 'idle',
        solverError: null,
        lastResult: null,
    })),
    setSolverStatus: (status, error) => set({ solverStatus: status, solverError: error ?? null }),
    setLastResult: (result, ms) => set({ lastResult: result, lastSolveMs: ms, solverStatus: result.converged ? 'running' : 'error' }),
    updateCursor: (x, z) => set({ cursorWorldPos: { x, z } }),
    updateFps: (fps) => set({ fps }),
}));
// ── SolidJS signal bridge ─────────────────────────────────────────────────────
const [selectedComponentId, setSelectedComponentId] = createSignal(null);
const [selectedWireId, setSelectedWireId] = createSignal(null);
const [isSimulating, setIsSimulating] = createSignal(false);
const [solverStatus, setSolverStatusSignal] = createSignal('idle');
const [solverError, setSolverErrorSignal] = createSignal(null);
const [lastResult, setLastResult] = createSignal(null);
const [lastSolveMs, setLastSolveMs] = createSignal(0);
const [cursorWorldPos, setCursorWorldPos] = createSignal({ x: 0, z: 0 });
const [fps, setFps] = createSignal(0);
_store.subscribe((s) => {
    setSelectedComponentId(s.selectedComponentId);
    setSelectedWireId(s.selectedWireId);
    setIsSimulating(s.isSimulating);
    setSolverStatusSignal(s.solverStatus);
    setSolverErrorSignal(s.solverError);
    setLastResult(s.lastResult);
    setLastSolveMs(s.lastSolveMs);
    setCursorWorldPos(s.cursorWorldPos);
    setFps(s.fps);
});
// ── Exported actions (for use outside SolidJS components) ─────────────────────
export const { selectComponent, selectWire, deselect, toggleSimulate, setSolverStatus, setLastResult: setLastResultAction, updateCursor, updateFps, } = _store.getState();
export const getSimSnapshot = () => _store.getState();
// ── Public hook ───────────────────────────────────────────────────────────────
export function useSimStore() {
    return {
        selectedComponentId,
        selectedWireId,
        isSimulating,
        solverStatus,
        solverError,
        lastResult,
        lastSolveMs,
        cursorWorldPos,
        fps,
        selectComponent,
        selectWire,
        deselect,
        toggleSimulate,
        setSolverStatus,
        setLastResult: setLastResultAction,
        updateCursor,
        updateFps,
    };
}
//# sourceMappingURL=simStore.js.map