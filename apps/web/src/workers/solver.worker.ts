import { expose } from 'comlink'
import { NetlistBuilder, MNASolver } from '@fermion/solver'
import type { NetlistInput, SolverResult } from '@fermion/solver'

class SolverWorker {
  solve(input: NetlistInput): SolverResult {
    const { netlist } = new NetlistBuilder().build(input)
    return new MNASolver().solve(netlist)
  }
}

expose(new SolverWorker())
