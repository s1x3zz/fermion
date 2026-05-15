import { Scene } from 'three';
import type { PlacedComponent } from '@fermion/core';
import type { Breadboard } from '../Breadboard';
import { ComponentMesh } from './ComponentMesh';
export declare class PotentiometerMesh extends ComponentMesh {
    constructor(scene: Scene, instance: PlacedComponent);
    private _build;
    setPosition(board: Breadboard): void;
}
//# sourceMappingURL=PotentiometerMesh.d.ts.map