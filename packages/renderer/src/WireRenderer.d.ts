import { Scene, Vector3, Mesh } from 'three';
export declare enum SignalType {
    VCC_5V = "VCC_5V",
    VCC_3V3 = "VCC_3V3",
    GND = "GND",
    DIGITAL = "DIGITAL",
    I2C_SDA = "I2C_SDA",
    I2C_SCL = "I2C_SCL",
    ANALOG = "ANALOG",
    GENERIC = "GENERIC"
}
export interface WireParams {
    pinA: Vector3;
    pinB: Vector3;
    normalA?: Vector3;
    normalB?: Vector3;
    signalType?: SignalType;
    dashed?: boolean;
}
export declare class WireRenderer {
    private scene;
    private wires;
    constructor(scene: Scene);
    addWire(id: string, params: WireParams): void;
    removeWire(id: string): void;
    updatePins(id: string, pinA: Vector3, pinB: Vector3): void;
    updateCurrent(id: string, current: number): void;
    setSelected(id: string, selected: boolean): void;
    setDashed(id: string, dashed: boolean): void;
    updateSignalType(id: string, signalType: SignalType): void;
    getMeshes(): Mesh[];
    update(time: number): void;
    dispose(): void;
}
//# sourceMappingURL=WireRenderer.d.ts.map