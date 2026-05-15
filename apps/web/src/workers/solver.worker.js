import { expose } from 'comlink';
import { NetlistBuilder, MNASolver } from '@fermion/solver';
class SolverWorker {
    solve(input) {
        const { netlist } = new NetlistBuilder().build(input);
        return new MNASolver().solve(netlist);
    }
}
expose(new SolverWorker());
//# sourceMappingURL=solver.worker.js.map