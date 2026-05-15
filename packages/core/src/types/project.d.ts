export interface ComponentInstance {
    id: string;
    type: string;
    position: [number, number, number];
    rotation: [number, number, number];
    properties: Record<string, unknown>;
}
export interface WireInstance {
    id: string;
    from: {
        componentId: string;
        pinId: string;
    };
    to: {
        componentId: string;
        pinId: string;
    };
    waypoints: [number, number, number][];
    signalType: string;
}
export interface NetNode {
    id: string;
    connectedPins: string[];
    voltage?: number | undefined;
}
/** Serialisable circuit snapshot (JSON-safe — no Maps). */
export interface CircuitGraph {
    components: ComponentInstance[];
    wires: WireInstance[];
    netlist: NetNode[];
}
export interface ProjectMetadata {
    componentCount: number;
    wireCount: number;
    simulatorVersion: string;
}
export interface FermionProject {
    id: string;
    name: string;
    description?: string | undefined;
    createdAt: number;
    updatedAt: number;
    thumbnail?: string | undefined;
    circuit: import('./components').BreadboardCircuit;
    metadata: ProjectMetadata;
}
export type UserTier = 'guest' | 'free' | 'pro' | 'team';
export declare const PROJECT_LIMITS: Record<UserTier, number>;
//# sourceMappingURL=project.d.ts.map