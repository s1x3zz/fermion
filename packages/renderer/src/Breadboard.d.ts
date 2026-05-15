import { Scene, Vector3 } from 'three';
export declare class Breadboard {
    private scene;
    private group;
    /** Geometries and materials to dispose on cleanup. */
    private disposables;
    constructor(scene: Scene, position?: Vector3);
    private _buildBase;
    private _buildHoles;
    private _buildRailStripes;
    /** Returns world-space position of a main-grid pin. row = 'a'–'j', col = 1–30. */
    getPinPosition(row: string, col: number): Vector3;
    /**
     * Snaps a world-space XZ position to the nearest main-grid pin.
     * Returns null when the cursor is more than 2 pitches from any valid pin.
     */
    snapToNearestPin(worldX: number, worldZ: number): {
        row: string;
        col: number;
    } | null;
    /** Returns world-space position of a power-rail pin. col = 1–25. */
    getPowerRailPosition(rail: 'vcc_top' | 'gnd_top' | 'vcc_bot' | 'gnd_bot', col: number): Vector3;
    dispose(): void;
}
//# sourceMappingURL=Breadboard.d.ts.map