export type Tier = 'guest' | 'free' | 'pro' | 'ultimate';
export interface Profile {
    id: string;
    email: string;
    tier: Tier;
    project_count: number;
    subscription_status: string;
}
export interface FermionProject {
    id: string;
    user_id: string;
    name: string;
    description: string | null;
    circuit: Record<string, unknown>;
    metadata: Record<string, unknown>;
    created_at: string;
    updated_at: string;
}
export declare const api: {
    getProfile(): Promise<Profile>;
    getProjects(): Promise<FermionProject[]>;
    saveProject(project: Partial<FermionProject> & {
        name: string;
        circuit: Record<string, unknown>;
        metadata: Record<string, unknown>;
    }): Promise<void>;
    deleteProject(id: string): Promise<void>;
    createCheckout(tier: "pro" | "ultimate"): Promise<{
        url: string;
    }>;
    createPortal(): Promise<{
        url: string;
    }>;
};
//# sourceMappingURL=api.d.ts.map