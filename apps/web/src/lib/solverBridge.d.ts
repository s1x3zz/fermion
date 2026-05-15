import type { SolverResult } from '@fermion/solver';
import type { PlacedComponent, PlacedWire } from '@fermion/core';
export declare function solveCircuit(components: Record<string, PlacedComponent>, wires: Record<string, PlacedWire>): Promise<SolverResult | null>;
export declare function resetSolverCache(): void;
//# sourceMappingURL=solverBridge.d.ts.map