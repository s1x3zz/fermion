import { serializeCircuit } from '@fermion/core';
import { subscribeToCircuit } from '../stores/circuitStore';
import { saveProject, saveDraft } from '../stores/projectStore';
let unsub = null;
let timer = null;
export function startAutosave(opts) {
    stopAutosave();
    const delay = opts.debounceMs ?? 2000;
    unsub = subscribeToCircuit(() => {
        opts.onDirtyChange(true);
        if (timer)
            clearTimeout(timer);
        timer = setTimeout(() => {
            void flush(opts);
        }, delay);
    });
}
export function stopAutosave() {
    if (unsub) {
        unsub();
        unsub = null;
    }
    if (timer) {
        clearTimeout(timer);
        timer = null;
    }
}
async function flush(opts) {
    const circuit = serializeCircuit(opts.getComponents(), opts.getWires());
    const active = opts.getActiveProject();
    try {
        if (active) {
            const updated = {
                ...active,
                circuit,
                updatedAt: Date.now(),
                metadata: {
                    ...active.metadata,
                    componentCount: circuit.components.length,
                    wireCount: circuit.wires.length,
                },
            };
            await saveProject(updated);
        }
        else {
            await saveDraft(circuit);
        }
        opts.onDirtyChange(false);
        opts.onAutosaved();
    }
    catch (err) {
        console.warn('[autosave] failed:', err);
    }
}
/** Force an immediate save (used before tab close / navigation). */
export async function flushAutosave(opts) {
    if (timer) {
        clearTimeout(timer);
        timer = null;
    }
    await flush(opts);
}
//# sourceMappingURL=autosave.js.map