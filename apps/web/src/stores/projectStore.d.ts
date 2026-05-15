import type { FermionProject, UserTier, BreadboardCircuit } from '@fermion/core';
export declare class ProjectLimitError extends Error {
    tier: UserTier;
    limit: number;
    constructor(tier: UserTier, limit: number);
}
export declare const loadProjects: () => Promise<void>, loadProject: (id: string) => Promise<FermionProject | null>, createProject: (name: string, description?: string) => Promise<FermionProject>, saveProject: (project: FermionProject) => Promise<void>, deleteProject: (id: string) => Promise<void>, setActiveProject: (id: string) => void, clearActiveProject: () => void, toggleCloudSync: () => Promise<void>, importProject: (file: File) => Promise<FermionProject>, exportProject: (id: string) => void, saveDraft: (circuit: BreadboardCircuit) => Promise<void>, loadDraft: () => Promise<{
    circuit: BreadboardCircuit;
    savedAt: number;
} | null>, clearDraft: () => Promise<void>;
export declare function useProjectStore(): {
    projects: import("solid-js").Accessor<FermionProject[]>;
    activeProject: import("solid-js").Accessor<FermionProject | null>;
    cloudSyncEnabled: import("solid-js").Accessor<boolean>;
    syncing: import("solid-js").Accessor<boolean>;
    loadProjects: () => Promise<void>;
    loadProject: (id: string) => Promise<FermionProject | null>;
    createProject: (name: string, description?: string) => Promise<FermionProject>;
    saveProject: (project: FermionProject) => Promise<void>;
    deleteProject: (id: string) => Promise<void>;
    setActiveProject: (id: string) => void;
    clearActiveProject: () => void;
    toggleCloudSync: () => Promise<void>;
    importProject: (file: File) => Promise<FermionProject>;
    exportProject: (id: string) => void;
    saveDraft: (circuit: BreadboardCircuit) => Promise<void>;
    loadDraft: () => Promise<{
        circuit: BreadboardCircuit;
        savedAt: number;
    } | null>;
    clearDraft: () => Promise<void>;
};
//# sourceMappingURL=projectStore.d.ts.map