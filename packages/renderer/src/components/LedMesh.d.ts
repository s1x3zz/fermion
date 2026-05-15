import { Scene } from 'three';
import type { PlacedComponent } from '@fermion/core';
import type { Breadboard } from '../Breadboard';
import { ComponentMesh } from './ComponentMesh';
export declare class LedMesh extends ComponentMesh {
    private _baseMat;
    private _domeMat;
    private _light;
    private _color;
    constructor(scene: Scene, instance: PlacedComponent);
    private _build;
    /** Call each simulation frame. current > 0 means LED is conducting. */
    setGlow(glowing: boolean, _current?: number): void;
    setPosition(board: Breadboard): void;
}
//# sourceMappingURL=LedMesh.d.ts.map