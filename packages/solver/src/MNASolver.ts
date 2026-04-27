export interface SolverResult {
  voltages: Float64Array
  currents: Float64Array
  converged: boolean
}

export class MNASolver {
  solve(_netlist: unknown): SolverResult {
    return {
      voltages: new Float64Array(0),
      currents: new Float64Array(0),
      converged: true,
    }
  }
}
