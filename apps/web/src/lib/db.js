import Dexie from 'dexie';
class FermionDB extends Dexie {
    projects;
    drafts;
    constructor() {
        super('fermion-local');
        this.version(1).stores({
            projects: 'id, name, updatedAt',
        });
        this.version(2).stores({
            projects: 'id, name, updatedAt',
            drafts: 'key',
        });
    }
}
export const db = new FermionDB();
//# sourceMappingURL=db.js.map