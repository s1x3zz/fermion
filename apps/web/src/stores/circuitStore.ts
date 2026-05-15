import { createSignal } from 'solid-js'
import { createStore } from 'zustand/vanilla'
import type { ComponentType, PlacedComponent, PinPosition, PlacedWire } from '@fermion/core'
import { COMPONENT_SPAN } from '@fermion/core'

interface CircuitState {
  components: Record<string, PlacedComponent>
  wires: Record<string, PlacedWire>
  // component actions
  addComponent: (type: ComponentType, row: string, col: number, rotation?: 0 | 90 | 180 | 270) => string
  removeComponent: (id: string) => void
  updateComponent: (id: string, patch: Partial<PlacedComponent>) => void
  isOccupied: (row: string, col: number) => boolean
  getOccupiedPins: () => Set<string>
  getComponent: (id: string) => PlacedComponent | undefined
  // wire actions
  addWire: (pinA: PinPosition, pinB: PinPosition, signalType?: string) => string
  removeWire: (id: string) => void
  updateWire: (id: string, patch: Partial<Omit<PlacedWire, 'id'>>) => void
  getWiresForPin: (row: string, col: number) => PlacedWire[]
  // bulk actions
  resetCircuit: () => void
  loadFromData: (components: Record<string, PlacedComponent>, wires: Record<string, PlacedWire>) => void
}

const _store = createStore<CircuitState>()((set, get) => ({
  components: {},
  wires: {},

  addComponent: (type, row, col, rotation = 0) => {
    const id = crypto.randomUUID()
    const instance: PlacedComponent = {
      id, type, position: { row, col }, rotation, properties: {},
    }
    set((s) => ({ components: { ...s.components, [id]: instance } }))
    return id
  },

  removeComponent: (id) => {
    set((s) => {
      const next = { ...s.components }
      delete next[id]
      return { components: next }
    })
  },

  updateComponent: (id, patch) => {
    set((s) => {
      const existing = s.components[id]
      if (!existing) return s
      return { components: { ...s.components, [id]: { ...existing, ...patch } } }
    })
  },

  getOccupiedPins: () => {
    const { components } = get()
    const pins = new Set<string>()
    for (const comp of Object.values(components)) {
      const span = COMPONENT_SPAN[comp.type] ?? 1
      for (let i = 0; i < span; i++) {
        pins.add(`${comp.position.row}:${comp.position.col + i}`)
      }
    }
    return pins
  },

  isOccupied: (row, col) => {
    const { components } = get()
    const pin = `${row}:${col}`
    for (const comp of Object.values(components)) {
      const span = COMPONENT_SPAN[comp.type] ?? 1
      for (let i = 0; i < span; i++) {
        if (`${comp.position.row}:${comp.position.col + i}` === pin) return true
      }
    }
    return false
  },

  getComponent: (id) => get().components[id],

  addWire: (pinA, pinB, signalType = 'GENERIC') => {
    const id = crypto.randomUUID()
    const wire: PlacedWire = { id, pinA, pinB, signalType }
    set((s) => ({ wires: { ...s.wires, [id]: wire } }))
    return id
  },

  removeWire: (id) => {
    set((s) => {
      const next = { ...s.wires }
      delete next[id]
      return { wires: next }
    })
  },

  updateWire: (id, patch) => {
    set((s) => {
      const existing = s.wires[id]
      if (!existing) return s
      return { wires: { ...s.wires, [id]: { ...existing, ...patch } } }
    })
  },

  getWiresForPin: (row, col) => {
    const { wires } = get()
    return Object.values(wires).filter(
      (w) =>
        (w.pinA.row === row && w.pinA.col === col) ||
        (w.pinB.row === row && w.pinB.col === col),
    )
  },

  resetCircuit: () => set({ components: {}, wires: {} }),

  loadFromData: (components, wires) => set({ components, wires }),
}))

// ── SolidJS signal bridge ─────────────────────────────────────────────────────

const [components, setComponents] = createSignal<Record<string, PlacedComponent>>({})
const [wires, setWires] = createSignal<Record<string, PlacedWire>>({})
const [componentCount, setComponentCount] = createSignal(0)
const [wireCount, setWireCount] = createSignal(0)

_store.subscribe((s) => {
  setComponents(s.components)
  setWires(s.wires)
  setComponentCount(Object.keys(s.components).length)
  setWireCount(Object.keys(s.wires).length)
})

// ── Subscribe helper (for autosave — works outside reactive roots) ─────────────

export function subscribeToCircuit(listener: () => void): () => void {
  return _store.subscribe(listener)
}

// ── Public hook ───────────────────────────────────────────────────────────────

const {
  addComponent,
  removeComponent,
  updateComponent,
  isOccupied,
  getOccupiedPins,
  getComponent,
  addWire,
  removeWire,
  updateWire,
  getWiresForPin,
  resetCircuit,
  loadFromData,
} = _store.getState()

export function useCircuitStore() {
  return {
    components,
    wires,
    componentCount,
    wireCount,
    addComponent,
    removeComponent,
    updateComponent,
    isOccupied,
    getOccupiedPins,
    getComponent,
    addWire,
    removeWire,
    updateWire,
    getWiresForPin,
    resetCircuit,
    loadFromData,
  }
}

// ── Raw snapshot accessor (for autosave) ──────────────────────────────────────

export function getCircuitSnapshot() {
  return _store.getState()
}
