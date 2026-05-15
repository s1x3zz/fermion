import { Scene, Group } from 'three';
import type { PlacedComponent } from '@fermion/core';
import type { Breadboard } from '../Breadboard';
export declare abstract class ComponentMesh {
    protected scene: Scene;
    protected group: Group;
    readonly instance: PlacedComponent;
    private _selIndicator;
    constructor(scene: Scene, instance: PlacedComponent);
    get object3D(): Group;
    /** Default: positions at primary pin, slightly elevated. Override for multi-pin components. */
    setPosition(board: Breadboard): void;
    setSelected(selected: boolean): void;
    dispose(): void;
}
//# sourceMappingURL=ComponentMesh.d.ts.map