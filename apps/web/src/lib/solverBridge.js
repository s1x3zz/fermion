import * as Comlink from 'comlink';
import { setSolverStatus } from '../stores/simStore';
let proxy = null;
function getProxy() {
    if (!proxy) {
        const worker = new Worker(new URL('../workers/solver.worker.ts', import.meta.url), { type: 'module' });
        proxy = Comlink.wrap(worker);
    }
    return proxy;
}
// ── Netlist hash ──────────────────────────────────────────────────────────────
let lastHash = '';
let lastResult = null;
// ── Public API ────────────────────────────────────────────────────────────────
export async function solveCircuit(components, wires) {
    const plainComponents = Object.values(components).map((c) => ({
        id: c.id,
        type: c.type,
        position: c.position,
        value: c.value,
    }));
    const plainWires = Object.values(wires).map((w) => ({
        id: w.id,
        pinA: w.pinA,
        pinB: w.pinB,
    }));
    const input = { components: plainComponents, wires: plainWires };
    const hash = JSON.stringify(input);
    if (hash === lastHash && lastResult)
        return lastResult;
    try {
        const result = await getProxy().solve(input);
        lastHash = hash;
        lastResult = result;
        return result;
    }
    catch (err) {
        setSolverStatus('error', String(err));
        return null;
    }
}
export function resetSolverCache() {
    lastHash = '';
    lastResult = null;
}
//# sourceMappingURL=solverBridge.js.map