import { ResistorMesh } from './components/ResistorMesh';
import { LedMesh } from './components/LedMesh';
import { BatteryMesh } from './components/BatteryMesh';
import { CapacitorMesh } from './components/CapacitorMesh';
import { TransistorMesh } from './components/TransistorMesh';
import { DiodeMesh } from './components/DiodeMesh';
import { PotentiometerMesh } from './components/PotentiometerMesh';
import { GroundMesh } from './components/GroundMesh';
import { GenericMesh } from './components/GenericMesh';
const REGISTRY = {
    // Passives
    resistor: ResistorMesh,
    capacitor: CapacitorMesh,
    inductor: GenericMesh, // stub — blue IC box
    potentiometer: PotentiometerMesh,
    // LEDs
    led_red: LedMesh,
    led_green: LedMesh,
    led_blue: LedMesh,
    led_yellow: LedMesh,
    // Semiconductors
    diode: DiodeMesh,
    npn_transistor: TransistorMesh,
    pnp_transistor: TransistorMesh,
    // Power
    battery_9v: BatteryMesh,
    voltage_source_dc: GenericMesh,
    ground: GroundMesh,
    // ICs / MCUs  — all handled by GenericMesh (sized + colored by type)
    '555_timer': GenericMesh,
    op_amp: GenericMesh,
    arduino_uno: GenericMesh,
    arduino_nano: GenericMesh,
};
export class ComponentRegistry {
    static createMesh(scene, instance) {
        const Ctor = REGISTRY[instance.type] ?? GenericMesh;
        return new Ctor(scene, instance);
    }
}
//# sourceMappingURL=ComponentRegistry.js.map