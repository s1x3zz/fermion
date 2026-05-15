import { Scene, Mesh, Vector3 } from 'three';
import type { PlacedComponent } from '@fermion/core';
import type { Breadboard } from '../Breadboard';
import { ComponentMesh } from './ComponentMesh';
export declare class ArduinoMesh extends ComponentMesh {
    ledL: Mesh;
    ledON: Mesh;
    ledTX: Mesh;
    ledRX: Mesh;
    private isNano;
    private pinPositions;
    constructor(scene: Scene, instance: PlacedComponent);
    private _build;
    setPosition(board: Breadboard): void;
    getPinHeaderPosition(pin: number | string): Vector3 | null;
    setLedState(led: 'L' | 'TX' | 'RX', state: boolean): void;
    getAllPins(): {
        pin: number;
        pos: Vector3;
    }[];
}
//# sourceMappingURL=ArduinoMesh.d.ts.map