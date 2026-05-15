import * as Comlink from 'comlink'
import type { NetlistInput, SolverResult, PlainComponent, PlainWire } from '@fermion/solver'
import type { PlacedComponent, PlacedWire } from '@fermion/core'
import { setSolverStatus } from '../stores/simStore'

// ── Lazy worker init ──────────────────────────────────────────────────────────

type SolverProxy = { solve(input: NetlistInput): Promise<SolverResult> }

let proxy: SolverProxy | null = null

function getProxy(): SolverProxy {
  if (!proxy) {
    const worker = new Worker(
      new URL('../workers/solver.worker.ts', import.meta.url),
      { type: 'module' },
    )
    proxy = Comlink.wrap<SolverProxy>(worker)
  }
  return proxy
}

// ── Netlist hash ──────────────────────────────────────────────────────────────

let lastHash = ''
let lastResult: SolverResult | null = null

// ── Public API ────────────────────────────────────────────────────────────────

export async function solveCircuit(
  components: Record<string, PlacedComponent>,
  wires: Record<string, PlacedWire>,
): Promise<SolverResult | null> {
  const plainComponents: PlainComponent[] = Object.values(components).map((c) => ({
    id: c.id,
    type: c.type,
    position: c.position,
    value: c.value,
  }))

  const plainWires: PlainWire[] = Object.values(wires).map((w) => ({
    id: w.id,
    pinA: w.pinA,
    pinB: w.pinB,
  }))

  const input: NetlistInput = { components: plainComponents, wires: plainWires }
  const hash = JSON.stringify(input)

  if (hash === lastHash && lastResult) return lastResult

  try {
    const result = await getProxy().solve(input)
    lastHash = hash
    lastResult = result
    return result
  } catch (err) {
    setSolverStatus('error', String(err))
    return null
  }
}

export function resetSolverCache(): void {
  lastHash = ''
  lastResult = null
}
