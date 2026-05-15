import Dexie, { type Table } from 'dexie';
import type { FermionProject, BreadboardCircuit } from '@fermion/core';
export interface DraftRecord {
    key: string;
    circuit: BreadboardCircuit;
    savedAt: number;
}
declare class FermionDB extends Dexie {
    projects: Table<FermionProject>;
    drafts: Table<DraftRecord>;
    constructor();
}
export declare const db: FermionDB;
export {};
//# sourceMappingURL=db.d.ts.map