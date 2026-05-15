// ── Types ─────────────────────────────────────────────────────────────────────

export interface ResistorElement {
  type: 'R'
  id: string
  nodeA: number
  nodeB: number
  value: number  // ohms
}

export interface VoltageElement {
  type: 'V'
  id: string
  nodePos: number
  nodeNeg: number
  value: number  // volts
}

export interface DiodeElement {
  type: 'D'
  id: string
  nodeA: number  // anode
  nodeK: number  // cathode
  Is: number
  n: number
  Vt: number
  Vf_clamp: number
}

export type SolverElement = ResistorElement | VoltageElement | DiodeElement

export interface Netlist {
  nodeCount: number      // total nodes including GND (node 0)
  elements: SolverElement[]
}

export interface SolverResult {
  nodeVoltages: number[]           // index = nodeId; nodeVoltages[0] = 0 (GND)
  branchCurrents: Record<string, number>  // elementId → amperes
  converged: boolean
  iterations: number
}

// ── NetlistInput (plain-object, safe for postMessage) ─────────────────────────

export interface PlainComponent {
  id: string
  type: string
  position: { row: string; col: number }
  value?: number | undefined
}

export interface PlainWire {
  id: string
  pinA: { row: string; col: number }
  pinB: { row: string; col: number }
}

export interface NetlistInput {
  components: PlainComponent[]
  wires: PlainWire[]
}

// ── LED Vf clamp values by colour ─────────────────────────────────────────────

const LED_VF: Record<string, number> = {
  led_red:    1.8,
  led_green:  2.2,
  led_yellow: 2.1,
  led_blue:   3.0,
}

// ── Union-Find ────────────────────────────────────────────────────────────────

class UnionFind {
  private parent = new Map<string, string>()

  private _root(k: string): string {
    if (!this.parent.has(k)) this.parent.set(k, k)
    if (this.parent.get(k) !== k) {
      this.parent.set(k, this._root(this.parent.get(k)!))
    }
    return this.parent.get(k)!
  }

  merge(a: string, b: string): void {
    const ra = this._root(a)
    const rb = this._root(b)
    if (ra !== rb) this.parent.set(ra, rb)
  }

  find(k: string): string { return this._root(k) }

  keys(): IterableIterator<string> { return this.parent.keys() }
}

// ── NetlistBuilder ────────────────────────────────────────────────────────────

const GND_KEY = '__gnd__'

/** Return the two pin keys for a component based on type and position. */
function componentPins(comp: PlainComponent): [string, string] {
  const { row, col } = comp.position
  const p = (r: string, c: number) => `${r}:${c}`

  switch (comp.type) {
    case 'resistor':
    case 'capacitor':
    case 'inductor':
    case 'diode':
    case 'potentiometer':
      return [p(row, col), p(row, col + 1)]

    case 'led_red':
    case 'led_green':
    case 'led_blue':
    case 'led_yellow':
      // Anode at primary pin, cathode at col+1 (wire connects to the right)
      return [p(row, col), p(row, col + 1)]

    case 'battery_9v':
    case 'voltage_source_dc':
      // Positive terminal at position pin, negative is GND
      return [p(row, col), GND_KEY]

    case 'ground':
      return [p(row, col), GND_KEY]

    default:
      return [p(row, col), p(row, col + 1)]
  }
}

/** Rail-row auto-merges: all pins on same power rail become one node. */
const RAIL_ROWS = ['vcc_top', 'vcc_bot', 'gnd_top', 'gnd_bot']
const GND_RAILS = new Set(['gnd_top', 'gnd_bot'])

export class NetlistBuilder {
  build(input: NetlistInput): { netlist: Netlist; pinToNode: Map<string, number> } {
    const uf = new UnionFind()

    // Seed GND key
    uf.find(GND_KEY)

    // Collect all component pins
    for (const comp of input.components) {
      const [pinA, pinB] = componentPins(comp)
      uf.find(pinA)
      uf.find(pinB)
    }

    // Collect all wire pins
    for (const wire of input.wires) {
      const ka = `${wire.pinA.row}:${wire.pinA.col}`
      const kb = `${wire.pinB.row}:${wire.pinB.col}`
      uf.find(ka)
      uf.find(kb)
    }

    // Auto-merge same-rail pins + GND rails → GND_KEY
    const railGroups = new Map<string, string>()  // railRow → first pin key on that rail
    for (const key of uf.keys()) {
      const [row] = key.split(':')
      if (!row || !RAIL_ROWS.includes(row)) continue
      if (GND_RAILS.has(row)) {
        uf.merge(key, GND_KEY)
      } else {
        // VCC rails: merge all pins on the same rail row together
        if (railGroups.has(row)) {
          uf.merge(key, railGroups.get(row)!)
        } else {
          railGroups.set(row, key)
        }
      }
    }

    // Merge pins from each component (short-circuit for ground/battery already handled)
    for (const comp of input.components) {
      if (comp.type === 'ground') {
        const [pinA] = componentPins(comp)
        uf.merge(pinA, GND_KEY)
      }
      // battery/voltage source pins are already set up correctly
    }

    // Merge pins from each wire
    for (const wire of input.wires) {
      const ka = `${wire.pinA.row}:${wire.pinA.col}`
      const kb = `${wire.pinB.row}:${wire.pinB.col}`
      uf.merge(ka, kb)
    }

    // Assign integer node IDs: GND root → 0, rest → 1,2,3...
    const rootToNode = new Map<string, number>()
    rootToNode.set(uf.find(GND_KEY), 0)

    for (const key of uf.keys()) {
      const root = uf.find(key)
      if (!rootToNode.has(root)) {
        rootToNode.set(root, rootToNode.size)
      }
    }

    // Build pin → nodeId map
    const pinToNode = new Map<string, number>()
    for (const key of uf.keys()) {
      pinToNode.set(key, rootToNode.get(uf.find(key))!)
    }
    pinToNode.set(GND_KEY, 0)

    const nodeCount = rootToNode.size

    // Build solver elements
    const elements: SolverElement[] = []

    for (const comp of input.components) {
      const [pinAKey, pinBKey] = componentPins(comp)
      const nodeA = pinToNode.get(pinAKey) ?? 0
      const nodeB = pinToNode.get(pinBKey) ?? 0

      switch (comp.type) {
        case 'resistor':
        case 'capacitor':
        case 'inductor':
        case 'potentiometer': {
          const r = comp.value ?? 1000
          elements.push({ type: 'R', id: comp.id, nodeA, nodeB, value: Math.max(r, 0.001) })
          break
        }
        case 'diode': {
          elements.push({
            type: 'D', id: comp.id,
            nodeA, nodeK: nodeB,
            Is: 1e-12, n: 1.8, Vt: 0.02585, Vf_clamp: 0.6,
          })
          break
        }
        case 'led_red':
        case 'led_green':
        case 'led_blue':
        case 'led_yellow': {
          elements.push({
            type: 'D', id: comp.id,
            nodeA, nodeK: nodeB,
            Is: 1e-12, n: 1.8, Vt: 0.02585,
            Vf_clamp: LED_VF[comp.type] ?? 2.0,
          })
          break
        }
        case 'battery_9v': {
          const v = comp.value ?? 9
          elements.push({ type: 'V', id: comp.id, nodePos: nodeA, nodeNeg: nodeB, value: v })
          break
        }
        case 'voltage_source_dc': {
          const v = comp.value ?? 5
          elements.push({ type: 'V', id: comp.id, nodePos: nodeA, nodeNeg: nodeB, value: v })
          break
        }
        // ground already handled by union-find merging
      }
    }

    return { netlist: { nodeCount, elements }, pinToNode }
  }
}

// ── Gaussian elimination with partial pivoting ────────────────────────────────

function gaussElim(A: number[][], b: number[]): number[] | null {
  const n = b.length
  const aug: number[][] = A.map((row, i) => [...row, b[i]!])

  for (let col = 0; col < n; col++) {
    // Partial pivot
    let maxRow = col
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(aug[row]![col]!) > Math.abs(aug[maxRow]![col]!)) maxRow = row
    }
    ;[aug[col], aug[maxRow]] = [aug[maxRow]!, aug[col]!]

    const piv = aug[col]![col]!
    if (Math.abs(piv) < 1e-15) return null  // singular / floating node

    for (let row = col + 1; row < n; row++) {
      const f = aug[row]![col]! / piv
      for (let k = col; k <= n; k++) aug[row]![k]! -= f * aug[col]![k]!
    }
  }

  // Back-substitution
  const x = new Array<number>(n).fill(0)
  for (let i = n - 1; i >= 0; i--) {
    x[i] = aug[i]![n]!
    for (let j = i + 1; j < n; j++) x[i]! -= aug[i]![j]! * (x[j] ?? 0)
    x[i] = (x[i] ?? 0) / aug[i]![i]!
  }
  return x
}

// ── MNA Solver ────────────────────────────────────────────────────────────────

const MAX_ITER = 50
const TOL = 1e-6

export class MNASolver {
  solve(netlist: Netlist): SolverResult {
    const { nodeCount, elements } = netlist
    const n = nodeCount - 1  // non-ground nodes (rows/cols in KCL block)

    const voltSrcs = elements.filter((e): e is VoltageElement => e.type === 'V')
    const diodes   = elements.filter((e): e is DiodeElement   => e.type === 'D')
    const resistors = elements.filter((e): e is ResistorElement => e.type === 'R')
    const m = voltSrcs.length
    const size = n + m

    if (size === 0) {
      return { nodeVoltages: [0], branchCurrents: {}, converged: true, iterations: 0 }
    }

    // Initial diode voltages guess
    const diodeVd = diodes.map(() => 0.0)

    let x: number[] = new Array(size).fill(0)
    let iterations = 0
    let converged = false

    for (let iter = 0; iter < MAX_ITER; iter++) {
      iterations++

      // Build MNA matrix [G B; C D] and RHS [I; E]
      const G: number[][] = Array.from({ length: size }, () => new Array(size).fill(0))
      const rhs: number[] = new Array(size).fill(0)

      // Stamp resistors
      for (const el of resistors) {
        const g = 1 / el.value
        const a = el.nodeA - 1
        const b = el.nodeB - 1
        if (a >= 0) G[a]![a]! += g
        if (b >= 0) G[b]![b]! += g
        if (a >= 0 && b >= 0) { G[a]![b]! -= g; G[b]![a]! -= g }
      }

      // Stamp diodes (Newton-Raphson linearization)
      for (let di = 0; di < diodes.length; di++) {
        const el = diodes[di]!
        const vd = diodeVd[di]!

        // Shockley
        const Id  = el.Is * (Math.exp(vd / (el.n * el.Vt)) - 1)
        const Geq = el.Is / (el.n * el.Vt) * Math.exp(vd / (el.n * el.Vt))
        const Ieq = Id - Geq * vd

        const a = el.nodeA - 1
        const k = el.nodeK - 1
        if (a >= 0) { G[a]![a]! += Geq; rhs[a]! -= Ieq }
        if (k >= 0) { G[k]![k]! += Geq; rhs[k]! += Ieq }
        if (a >= 0 && k >= 0) { G[a]![k]! -= Geq; G[k]![a]! -= Geq }
      }

      // Stamp voltage sources (B/C blocks)
      for (let vi = 0; vi < voltSrcs.length; vi++) {
        const el = voltSrcs[vi]!
        const row = n + vi
        const p   = el.nodePos - 1
        const ng  = el.nodeNeg - 1
        if (p >= 0) { G[p]![row]! += 1; G[row]![p]! += 1 }
        if (ng >= 0) { G[ng]![row]! -= 1; G[row]![ng]! -= 1 }
        rhs[row]! += el.value
      }

      const sol = gaussElim(G, rhs)
      if (!sol) {
        // Singular — floating node; return zeros
        return { nodeVoltages: new Array(nodeCount).fill(0), branchCurrents: {}, converged: false, iterations }
      }

      // Check convergence
      let maxDelta = 0
      for (let i = 0; i < n; i++) {
        maxDelta = Math.max(maxDelta, Math.abs(sol[i]! - x[i]!))
      }

      x = sol

      // Update diode voltage estimates
      for (let di = 0; di < diodes.length; di++) {
        const el = diodes[di]!
        const vA = el.nodeA > 0 ? (x[el.nodeA - 1] ?? 0) : 0
        const vK = el.nodeK > 0 ? (x[el.nodeK - 1] ?? 0) : 0
        let vd = vA - vK
        // Hysteresis guard: clamp if oscillating near Vf
        if (vd > el.Vf_clamp) vd = el.Vf_clamp
        if (vd < 0) vd = 0
        diodeVd[di] = vd
      }

      if (maxDelta < TOL) { converged = true; break }
    }

    // Build nodeVoltages array (index = nodeId, 0 = GND = 0V)
    const nodeVoltages = new Array(nodeCount).fill(0)
    for (let i = 0; i < n; i++) nodeVoltages[i + 1] = x[i] ?? 0

    // Compute branch currents
    const branchCurrents: Record<string, number> = {}

    for (const el of resistors) {
      const vA = nodeVoltages[el.nodeA] ?? 0
      const vB = nodeVoltages[el.nodeB] ?? 0
      branchCurrents[el.id] = (vA - vB) / el.value
    }

    for (let di = 0; di < diodes.length; di++) {
      const el = diodes[di]!
      const vd = diodeVd[di]!
      branchCurrents[el.id] = el.Is * (Math.exp(vd / (el.n * el.Vt)) - 1)
    }

    for (let vi = 0; vi < voltSrcs.length; vi++) {
      branchCurrents[voltSrcs[vi]!.id] = x[n + vi] ?? 0
    }

    return { nodeVoltages, branchCurrents, converged, iterations }
  }
}
