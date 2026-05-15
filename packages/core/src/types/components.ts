export type ComponentType =
  | 'resistor' | 'capacitor' | 'inductor' | 'potentiometer'
  | 'led_red' | 'led_green' | 'led_blue' | 'led_yellow'
  | 'diode' | 'npn_transistor' | 'pnp_transistor'
  | 'battery_9v' | 'voltage_source_dc' | 'ground'
  | 'arduino_uno' | 'arduino_nano'
  | '555_timer' | 'op_amp'

export interface PinPosition {
  row: string
  col: number
}

export interface PlacedComponent {
  id: string
  type: ComponentType
  position: PinPosition
  rotation: 0 | 90 | 180 | 270
  label?: string | undefined
  value?: number | undefined
  properties: Record<string, unknown>
}

export interface PlacedWire {
  id: string
  pinA: PinPosition
  pinB: PinPosition
  signalType: string
}

/** Serialisable circuit snapshot — stored in FermionProject.circuit. */
export interface BreadboardCircuit {
  components: PlacedComponent[]
  wires: PlacedWire[]
}

/** Breadboard columns occupied by each component type (0 = not pin-snapped). */
export const COMPONENT_SPAN: Record<ComponentType, number> = {
  resistor:          2,
  capacitor:         2,
  inductor:          2,
  potentiometer:     3,
  led_red:           1,
  led_green:         1,
  led_blue:          1,
  led_yellow:        1,
  diode:             2,
  npn_transistor:    1,
  pnp_transistor:    1,
  battery_9v:        0,
  voltage_source_dc: 0,
  ground:            1,
  arduino_uno:       0,
  arduino_nano:      0,
  '555_timer':       4,
  op_amp:            4,
}
