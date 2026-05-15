import type { PlacedComponent, PlacedWire, BreadboardCircuit } from './types/components'
import { BreadboardCircuitSchema } from './schemas'

export const CURRENT_VERSION = '0.1.0'

export interface CircuitSnapshot {
  version: string
  savedAt: number
  circuit: BreadboardCircuit
  metadata: {
    componentCount: number
    wireCount: number
    simulatorVersion: string
  }
}

export function serializeCircuit(
  components: Record<string, PlacedComponent>,
  wires: Record<string, PlacedWire>,
): BreadboardCircuit {
  return {
    components: Object.values(components),
    wires: Object.values(wires),
  }
}

export function deserializeCircuit(circuit: BreadboardCircuit): {
  components: Record<string, PlacedComponent>
  wires: Record<string, PlacedWire>
} {
  const comps: Record<string, PlacedComponent> = {}
  for (const c of circuit.components) comps[c.id] = c as PlacedComponent

  const ws: Record<string, PlacedWire> = {}
  for (const w of circuit.wires) ws[w.id] = w

  return { components: comps, wires: ws }
}

export function validateCircuit(data: unknown): BreadboardCircuit {
  return BreadboardCircuitSchema.parse(data) as BreadboardCircuit
}

export function makeCircuitSnapshot(
  components: Record<string, PlacedComponent>,
  wires: Record<string, PlacedWire>,
): CircuitSnapshot {
  const circuit = serializeCircuit(components, wires)
  return {
    version: CURRENT_VERSION,
    savedAt: Date.now(),
    circuit,
    metadata: {
      componentCount: circuit.components.length,
      wireCount: circuit.wires.length,
      simulatorVersion: CURRENT_VERSION,
    },
  }
}
