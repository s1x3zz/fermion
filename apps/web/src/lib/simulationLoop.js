import { solveCircuit, resetSolverCache } from './solverBridge';
import { setSolverStatus, setLastResultAction } from '../stores/simStore';
import { injectAvrComponents } from './avrCircuitBridge';
let intervalId = null;
export function startSimulationLoop(callbacks) {
    stopSimulationLoop();
    resetSolverCache();
    const tick = async () => {
        const t0 = performance.now();
        let comps = callbacks.getComponents();
        let wires = callbacks.getWires();
        // Inject AVR outputs
        const augmented = injectAvrComponents(comps, wires);
        const result = await solveCircuit(augmented.components, augmented.wires);
        if (!result)
            return;
        const ms = Math.round(performance.now() - t0);
        setLastResultAction(result, ms);
        applyResults(result, callbacks);
    };
    intervalId = setInterval(() => { void tick(); }, 100);
    void tick(); // immediate first run
}
export function stopSimulationLoop() {
    if (intervalId !== null) {
        clearInterval(intervalId);
        intervalId = null;
    }
    setSolverStatus('idle');
    resetSolverCache();
}
function applyResults(result, cb) {
    const components = cb.getComponents();
    for (const [id, current] of Object.entries(result.branchCurrents)) {
        // Wire current updates
        cb.onWireCurrentUpdate(id, Math.abs(current));
        // LED / component glow
        const comp = components[id];
        if (comp?.type.startsWith('led_')) {
            const isOn = Math.abs(current) > 0.001;
            cb.onComponentGlow(id, isOn, Math.abs(current));
        }
    }
}
//# sourceMappingURL=simulationLoop.js.map