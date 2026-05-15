import { Scene } from 'three';
import type { PlacedComponent } from '@fermion/core';
import type { Breadboard } from '../Breadboard';
import { ComponentMesh } from './ComponentMesh';
export declare class TransistorMesh extends ComponentMesh {
    constructor(scene: Scene, instance: PlacedComponent);
    private _build;
    setPosition(board: Breadboard): void;
}
//# sourceMappingURL=TransistorMesh.d.ts.map