import type { PlacedComponent, PlacedWire, FermionProject } from '@fermion/core'
import { serializeCircuit } from '@fermion/core'
import { subscribeToCircuit } from '../stores/circuitStore'
import { saveProject, saveDraft } from '../stores/projectStore'
import { db } from './db'

export interface AutosaveOptions {
  getComponents: () => Record<string, PlacedComponent>
  getWires: () => Record<string, PlacedWire>
  getActiveProject: () => FermionProject | null
  onDirtyChange: (dirty: boolean) => void
  onAutosaved: () => void
  debounceMs?: number
}

let unsub: (() => void) | null = null
let timer: ReturnType<typeof setTimeout> | null = null

export function startAutosave(opts: AutosaveOptions): void {
  stopAutosave()
  const delay = opts.debounceMs ?? 2000

  unsub = subscribeToCircuit(() => {
    opts.onDirtyChange(true)

    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      void flush(opts)
    }, delay)
  })
}

export function stopAutosave(): void {
  if (unsub) { unsub(); unsub = null }
  if (timer) { clearTimeout(timer); timer = null }
}

async function flush(opts: AutosaveOptions): Promise<void> {
  const circuit = serializeCircuit(opts.getComponents(), opts.getWires())
  const active = opts.getActiveProject()

  try {
    if (active) {
      const updated: FermionProject = {
        ...active,
        circuit,
        updatedAt: Date.now(),
        metadata: {
          ...active.metadata,
          componentCount: circuit.components.length,
          wireCount: circuit.wires.length,
        },
      }
      await saveProject(updated)
    } else {
      await saveDraft(circuit)
    }
    opts.onDirtyChange(false)
    opts.onAutosaved()
  } catch (err) {
    console.warn('[autosave] failed:', err)
  }
}

/** Force an immediate save (used before tab close / navigation). */
export async function flushAutosave(opts: AutosaveOptions): Promise<void> {
  if (timer) { clearTimeout(timer); timer = null }
  await flush(opts)
}
