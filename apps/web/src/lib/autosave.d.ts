import type { PlacedComponent, PlacedWire, FermionProject } from '@fermion/core';
export interface AutosaveOptions {
    getComponents: () => Record<string, PlacedComponent>;
    getWires: () => Record<string, PlacedWire>;
    getActiveProject: () => FermionProject | null;
    onDirtyChange: (dirty: boolean) => void;
    onAutosaved: () => void;
    debounceMs?: number;
}
export declare function startAutosave(opts: AutosaveOptions): void;
export declare function stopAutosave(): void;
/** Force an immediate save (used before tab close / navigation). */
export declare function flushAutosave(opts: AutosaveOptions): Promise<void>;
//# sourceMappingURL=autosave.d.ts.map