import { Show } from 'solid-js';
import { useSimStore } from '../../stores/simStore';
import { useCircuitStore } from '../../stores/circuitStore';
export function StatusBar() {
    const sim = useSimStore();
    const circuit = useCircuitStore();
    const statusClass = () => {
        switch (sim.solverStatus()) {
            case 'running': return 'simulating';
            case 'error': return 'error';
            default: return 'ready';
        }
    };
    const statusText = () => {
        switch (sim.solverStatus()) {
            case 'running': {
                const ms = sim.lastSolveMs();
                const result = sim.lastResult();
                if (result) {
                    return result.converged
                        ? `Converged (${ms}ms, ${result.iterations} iter)`
                        : `Not converged (${ms}ms)`;
                }
                return 'Simulating…';
            }
            case 'error': return `Solver error: ${sim.solverError() ?? 'unknown'}`;
            default: return 'Ready';
        }
    };
    return (<div class="sim-statusbar">
      {/* Left: solver status */}
      <div class="statusbar-section">
        <Show when={sim.solverStatus() === 'running'}>
          <div class="statusbar-sim-dot"/>
        </Show>
        <span class={`statusbar-text ${statusClass()}`}>{statusText()}</span>
      </div>

      <div class="statusbar-divider"/>

      {/* Center: cursor world position */}
      <div class="statusbar-section statusbar-section-center">
        <span class="statusbar-text">
          X: {sim.cursorWorldPos().x.toFixed(2)}&nbsp;&nbsp;
          Z: {sim.cursorWorldPos().z.toFixed(2)}
        </span>
      </div>

      {/* Right: live counts + FPS */}
      <div class="statusbar-section statusbar-section-right">
        <span class="statusbar-text">{circuit.componentCount()} components</span>
        <div class="statusbar-divider"/>
        <span class="statusbar-text">{circuit.wireCount()} wires</span>
        <div class="statusbar-divider"/>
        <span class="statusbar-text">{sim.fps()} fps</span>
      </div>
    </div>);
}
//# sourceMappingURL=StatusBar.jsx.map