import { createSignal } from 'solid-js';
import { createStore } from 'zustand/vanilla';
import { db } from '../lib/db';
import { supabase } from '../lib/supabase';
import { getAuthSnapshot } from './authStore';
import { PROJECT_LIMITS, FermionProjectSchema } from '@fermion/core';
// ── Error types ───────────────────────────────────────────────────────────────
export class ProjectLimitError extends Error {
    tier;
    limit;
    constructor(tier, limit) {
        super(`Project limit reached for ${tier} tier (max ${limit})`);
        this.tier = tier;
        this.limit = limit;
        this.name = 'ProjectLimitError';
    }
}
// ── Helpers ───────────────────────────────────────────────────────────────────
function getUserTier() {
    const { user } = getAuthSnapshot();
    if (!user)
        return 'guest';
    return user.user_metadata?.tier ?? 'free';
}
function emptyCircuit() {
    return { components: [], wires: [] };
}
function newProject(name, description) {
    const now = Date.now();
    return {
        id: crypto.randomUUID(),
        name,
        ...(description !== undefined ? { description } : {}),
        createdAt: now,
        updatedAt: now,
        circuit: emptyCircuit(),
        metadata: { componentCount: 0, wireCount: 0, simulatorVersion: '0.1.0' },
    };
}
// ── Supabase cloud helpers ────────────────────────────────────────────────────
async function pushToCloud(project) {
    const { user } = getAuthSnapshot();
    if (!user)
        return;
    const { error } = await supabase.from('projects').upsert({
        id: project.id,
        user_id: user.id,
        name: project.name,
        description: project.description ?? null,
        created_at: new Date(project.createdAt).toISOString(),
        updated_at: new Date(project.updatedAt).toISOString(),
        thumbnail: project.thumbnail ?? null,
        circuit: project.circuit,
        metadata: project.metadata,
    });
    if (error)
        throw error;
}
async function deleteFromCloud(id) {
    const { user } = getAuthSnapshot();
    if (!user)
        return;
    const { error } = await supabase.from('projects').delete().eq('id', id).eq('user_id', user.id);
    if (error)
        throw error;
}
async function fetchFromCloud() {
    const { user } = getAuthSnapshot();
    if (!user)
        return [];
    const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });
    if (error)
        throw error;
    return (data ?? []).map((row) => ({
        id: row.id,
        name: row.name,
        description: row.description ?? undefined,
        createdAt: new Date(row.created_at).getTime(),
        updatedAt: new Date(row.updated_at).getTime(),
        thumbnail: row.thumbnail ?? undefined,
        circuit: row.circuit,
        metadata: row.metadata,
    }));
}
const _store = createStore()((set, get) => ({
    projects: [],
    activeProject: null,
    cloudSyncEnabled: false,
    syncing: false,
    loadProjects: async () => {
        set({ syncing: true });
        try {
            const { cloudSyncEnabled } = get();
            const tier = getUserTier();
            if (cloudSyncEnabled && tier !== 'guest') {
                const cloud = await fetchFromCloud();
                await Promise.all(cloud.map((p) => db.projects.put(p)));
            }
            const local = await db.projects.orderBy('updatedAt').reverse().toArray();
            set({ projects: local });
        }
        finally {
            set({ syncing: false });
        }
    },
    loadProject: async (id) => {
        const project = await db.projects.get(id);
        if (!project)
            return null;
        set({ activeProject: project });
        set((s) => ({
            projects: s.projects.some((p) => p.id === id)
                ? s.projects
                : [project, ...s.projects],
        }));
        return project;
    },
    createProject: async (name, description) => {
        const { projects } = get();
        const tier = getUserTier();
        const limit = PROJECT_LIMITS[tier];
        if (projects.length >= limit)
            throw new ProjectLimitError(tier, limit);
        const project = newProject(name, description);
        await db.projects.add(project);
        const { cloudSyncEnabled } = get();
        if (cloudSyncEnabled && tier !== 'guest') {
            set({ syncing: true });
            try {
                await pushToCloud(project);
            }
            finally {
                set({ syncing: false });
            }
        }
        set((s) => ({ projects: [project, ...s.projects] }));
        return project;
    },
    saveProject: async (project) => {
        const updated = { ...project, updatedAt: Date.now() };
        await db.projects.put(updated);
        const { cloudSyncEnabled } = get();
        const tier = getUserTier();
        if (cloudSyncEnabled && tier !== 'guest') {
            set({ syncing: true });
            try {
                await pushToCloud(updated);
            }
            finally {
                set({ syncing: false });
            }
        }
        set((s) => ({
            projects: s.projects.map((p) => (p.id === updated.id ? updated : p)),
            activeProject: s.activeProject?.id === updated.id ? updated : s.activeProject,
        }));
    },
    deleteProject: async (id) => {
        await db.projects.delete(id);
        const { cloudSyncEnabled } = get();
        const tier = getUserTier();
        if (cloudSyncEnabled && tier !== 'guest') {
            set({ syncing: true });
            try {
                await deleteFromCloud(id);
            }
            finally {
                set({ syncing: false });
            }
        }
        set((s) => ({
            projects: s.projects.filter((p) => p.id !== id),
            activeProject: s.activeProject?.id === id ? null : s.activeProject,
        }));
    },
    setActiveProject: (id) => {
        const project = get().projects.find((p) => p.id === id) ?? null;
        set({ activeProject: project });
    },
    clearActiveProject: () => set({ activeProject: null }),
    toggleCloudSync: async () => {
        const next = !get().cloudSyncEnabled;
        set({ cloudSyncEnabled: next });
        if (next)
            await get().loadProjects();
    },
    importProject: async (file) => {
        const text = await file.text();
        let raw;
        try {
            raw = JSON.parse(text);
        }
        catch {
            throw new Error('Invalid JSON file');
        }
        const result = FermionProjectSchema.safeParse(raw);
        if (!result.success)
            throw new Error(`Invalid project file: ${result.error.issues[0]?.message}`);
        const { projects } = get();
        const tier = getUserTier();
        const limit = PROJECT_LIMITS[tier];
        if (projects.length >= limit)
            throw new ProjectLimitError(tier, limit);
        const d = result.data;
        const project = {
            id: crypto.randomUUID(),
            name: d.name,
            createdAt: d.createdAt,
            updatedAt: Date.now(),
            circuit: d.circuit,
            metadata: d.metadata,
            ...(d.description !== undefined ? { description: d.description } : {}),
            ...(d.thumbnail !== undefined ? { thumbnail: d.thumbnail } : {}),
        };
        await db.projects.add(project);
        const { cloudSyncEnabled } = get();
        if (cloudSyncEnabled && tier !== 'guest') {
            set({ syncing: true });
            try {
                await pushToCloud(project);
            }
            finally {
                set({ syncing: false });
            }
        }
        set((s) => ({ projects: [project, ...s.projects] }));
        return project;
    },
    exportProject: (id) => {
        const project = get().projects.find((p) => p.id === id);
        if (!project)
            return;
        const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${project.name.replace(/\s+/g, '_')}.fermion.json`;
        a.click();
        URL.revokeObjectURL(url);
    },
    saveDraft: async (circuit) => {
        await db.drafts.put({ key: 'autosave', circuit, savedAt: Date.now() });
    },
    loadDraft: async () => {
        const record = await db.drafts.get('autosave');
        if (!record)
            return null;
        return { circuit: record.circuit, savedAt: record.savedAt };
    },
    clearDraft: async () => {
        await db.drafts.delete('autosave');
    },
}));
// ── SolidJS reactive signals ──────────────────────────────────────────────────
const [projects, setProjects] = createSignal([]);
const [activeProject, setActiveProjectSignal] = createSignal(null);
const [cloudSyncEnabled, setCloudSyncEnabled] = createSignal(false);
const [syncing, setSyncing] = createSignal(false);
_store.subscribe((state) => {
    setProjects(state.projects);
    setActiveProjectSignal(state.activeProject);
    setCloudSyncEnabled(state.cloudSyncEnabled);
    setSyncing(state.syncing);
});
// ── Exported actions (usable outside SolidJS components) ──────────────────────
export const { loadProjects, loadProject, createProject, saveProject, deleteProject, setActiveProject, clearActiveProject, toggleCloudSync, importProject, exportProject, saveDraft, loadDraft, clearDraft, } = _store.getState();
// ── Public hook ───────────────────────────────────────────────────────────────
export function useProjectStore() {
    return {
        projects,
        activeProject,
        cloudSyncEnabled,
        syncing,
        loadProjects,
        loadProject,
        createProject,
        saveProject,
        deleteProject,
        setActiveProject,
        clearActiveProject,
        toggleCloudSync,
        importProject,
        exportProject,
        saveDraft,
        loadDraft,
        clearDraft,
    };
}
//# sourceMappingURL=projectStore.js.map