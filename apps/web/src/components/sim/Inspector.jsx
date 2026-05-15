import { Show, createSignal, createEffect, For } from 'solid-js';
import { useSimStore } from '../../stores/simStore';
import { useProjectStore } from '../../stores/projectStore';
import { useCircuitStore } from '../../stores/circuitStore';
// ── Wire signal type options ───────────────────────────────────────────────────
const SIGNAL_TYPES = [
    { value: 'VCC_5V', label: 'VCC 5V', color: '#ff2a2a' },
    { value: 'VCC_3V3', label: 'VCC 3.3V', color: '#ff8800' },
    { value: 'GND', label: 'GND', color: '#888888' },
    { value: 'DIGITAL', label: 'Digital', color: '#ffd400' },
    { value: 'I2C_SDA', label: 'I2C SDA', color: '#2070ff' },
    { value: 'I2C_SCL', label: 'I2C SCL', color: '#22cc22' },
    { value: 'ANALOG', label: 'Analog', color: '#f0f0f0' },
    { value: 'GENERIC', label: 'Generic', color: '#9b59b6' },
];
const LED_COLORS = ['#ef4444', '#22c55e', '#3b82f6', '#eab308', '#ffffff', '#f97316'];
// ── Empty / idle state ────────────────────────────────────────────────────────
function EmptyState() {
    const project = useProjectStore();
    const circuit = useCircuitStore();
    return (<div class="inspector-empty">
      <div class="inspector-empty-icon">✦</div>
      <p class="inspector-empty-text">Select a component or wire to inspect it</p>

      <div class="inspector-stats">
        <div class="inspector-stat-row">
          <span class="inspector-stat-label">Components</span>
          <span class="inspector-stat-value">{circuit.componentCount()}</span>
        </div>
        <div class="inspector-stat-row">
          <span class="inspector-stat-label">Wires</span>
          <span class="inspector-stat-value">{circuit.wireCount()}</span>
        </div>
      </div>
    </div>);
}
// ── Simulation results panel ──────────────────────────────────────────────────
function SimResultsPanel(props) {
    const sim = useSimStore();
    const current = () => {
        const r = sim.lastResult();
        return r?.branchCurrents[props.compId] ?? null;
    };
    // Voltage across = difference between the two node voltages for this element.
    // We approximate it from P = V*I using V = P/I when I > 0.
    // A cleaner approach would need the node IDs — here we use Ohm's law readout.
    const voltage = () => {
        const c = current();
        const r = sim.lastResult();
        if (c === null || !r)
            return null;
        // For now, show as a placeholder voltage derived from the node voltages array
        // (full per-component voltage requires node ID from NetlistBuilder — stored separately)
        return null; // will be non-null when nodeVoltage tracking is wired in
    };
    const fmt = (v, unit, scale = 1) => v === null ? '—' : `${(v * scale).toFixed(2)} ${unit}`;
    const i = () => current();
    const v = () => voltage();
    const p = () => {
        const c = i();
        const vv = v();
        if (c === null || vv === null)
            return null;
        return Math.abs(c * vv);
    };
    return (<div class="inspector-sim-section">
      <div class="inspector-sim-title">Simulation</div>
      <div class="inspector-sim-row">
        <span class="inspector-sim-row-label">Voltage across</span>
        <span class="inspector-sim-row-value">{fmt(v(), 'V')}</span>
      </div>
      <div class="inspector-sim-row">
        <span class="inspector-sim-row-label">Current through</span>
        <span class="inspector-sim-row-value">{fmt(i(), 'mA', 1000)}</span>
      </div>
      <div class="inspector-sim-row">
        <span class="inspector-sim-row-label">Power</span>
        <span class="inspector-sim-row-value">{fmt(p(), 'mW', 1000)}</span>
      </div>
    </div>);
}
// ── Component inspector ───────────────────────────────────────────────────────
function ComponentInspector(props) {
    const sim = useSimStore();
    const circuit = useCircuitStore();
    const comp = () => circuit.components()[props.id];
    const typeName = () => comp()?.type ?? 'unknown';
    const isLed = () => typeName().startsWith('led_');
    const [labelInput, setLabelInput] = createSignal(comp()?.label ?? '');
    const [valueInput, setValueInput] = createSignal(String(comp()?.value ?? 1000));
    const [rotation, setRotation] = createSignal(comp()?.rotation ?? 0);
    const [ledColor, setLedColor] = createSignal('#ef4444');
    // Sync inputs when the selected component changes
    createEffect(() => {
        const c = comp();
        if (!c)
            return;
        setLabelInput(c.label ?? '');
        setValueInput(String(c.value ?? 1000));
        setRotation(c.rotation);
    });
    function handleLabelBlur() {
        const c = comp();
        if (c)
            circuit.updateComponent(c.id, { label: labelInput() || undefined });
    }
    function handleValueBlur() {
        const c = comp();
        const n = parseFloat(valueInput());
        if (c && !isNaN(n))
            circuit.updateComponent(c.id, { value: n });
    }
    function handleRotationChange(v) {
        const r = Number(v);
        setRotation(r);
        const c = comp();
        if (c)
            circuit.updateComponent(c.id, { rotation: r });
    }
    return (<div>
      <div class="inspector-comp-header">
        <span class="inspector-comp-name">{comp()?.label ?? typeName()}</span>
        <span class="inspector-type-badge">{typeName()}</span>
      </div>

      <div class="inspector-field">
        <label class="inspector-label">Value (Ω / F / H)</label>
        <input class="inspector-input" type="text" value={valueInput()} onInput={(e) => setValueInput(e.currentTarget.value)} onBlur={handleValueBlur}/>
      </div>

      <div class="inspector-field">
        <label class="inspector-label">Label</label>
        <input class="inspector-input" type="text" placeholder="e.g. R1" value={labelInput()} onInput={(e) => setLabelInput(e.currentTarget.value)} onBlur={handleLabelBlur}/>
      </div>

      <Show when={isLed()}>
        <div class="inspector-field">
          <label class="inspector-label">Color</label>
          <div class="color-row">
            <For each={LED_COLORS}>
              {(c) => (<div class={`color-swatch${ledColor() === c ? ' selected' : ''}`} style={{ background: c }} onClick={() => setLedColor(c)} title={c}/>)}
            </For>
          </div>
        </div>
      </Show>

      <div class="inspector-field">
        <label class="inspector-label">Rotation</label>
        <select class="inspector-select" value={rotation()} onChange={(e) => handleRotationChange(e.currentTarget.value)}>
          <option value={0}>0°</option>
          <option value={90}>90°</option>
          <option value={180}>180°</option>
          <option value={270}>270°</option>
        </select>
      </div>

      <Show when={sim.isSimulating()}>
        <SimResultsPanel compId={props.id}/>
      </Show>

      <Show when={typeName().startsWith('arduino_')}>
        <button class="inspector-delete-btn" style={{ background: '#1976d2', "margin-bottom": '8px' }} onClick={() => props.onOpenSketch(props.id)}>
          Open Sketch
        </button>
      </Show>

      <button class="inspector-delete-btn" onClick={props.onDelete}>
        Delete component
      </button>
    </div>);
}
// ── Wire inspector ────────────────────────────────────────────────────────────
function WireInspector(props) {
    const sim = useSimStore();
    const circuit = useCircuitStore();
    const wire = () => circuit.wires()[props.id];
    const [signalType, setSignalType] = createSignal(wire()?.signalType ?? 'GENERIC');
    // Keep local signal in sync when store changes (e.g., undo)
    createEffect(() => {
        const st = wire()?.signalType;
        if (st)
            setSignalType(st);
    });
    const currentColor = () => SIGNAL_TYPES.find((s) => s.value === signalType())?.color ?? '#888';
    function handleSignalTypeChange(v) {
        setSignalType(v);
        circuit.updateWire(props.id, { signalType: v });
    }
    const pinLabel = (pin) => pin ? `${pin.row.toUpperCase()}${pin.col}` : '—';
    return (<div>
      <div class="inspector-wire-header">
        <div class="inspector-wire-dot" style={{ background: currentColor() }}/>
        <span class="inspector-comp-name">Wire</span>
        <span class="inspector-type-badge">wire</span>
      </div>

      <div class="inspector-field">
        <label class="inspector-label">From → To</label>
        <div class="inspector-pin-route">
          <span class="inspector-pin-badge">{pinLabel(wire()?.pinA)}</span>
          <span class="inspector-pin-arrow">→</span>
          <span class="inspector-pin-badge">{pinLabel(wire()?.pinB)}</span>
        </div>
      </div>

      <div class="inspector-field">
        <label class="inspector-label">Signal type</label>
        <select class="inspector-select" value={signalType()} onChange={(e) => handleSignalTypeChange(e.currentTarget.value)}>
          <For each={SIGNAL_TYPES}>
            {(st) => <option value={st.value}>{st.label}</option>}
          </For>
        </select>
      </div>

      <Show when={sim.isSimulating()}>
        <div class="inspector-sim-section">
          <div class="inspector-sim-title">Simulation</div>
          <div class="inspector-sim-row">
            <span class="inspector-sim-row-label">Current</span>
            <span class="inspector-sim-row-value">
              {(() => {
            const c = sim.lastResult()?.branchCurrents[props.id] ?? null;
            return c === null ? '—' : `${(c * 1000).toFixed(2)} mA`;
        })()}
            </span>
          </div>
        </div>
      </Show>

      <button class="inspector-delete-btn" onClick={props.onDelete}>
        Delete wire
      </button>
    </div>);
}
// ── Inspector panel ───────────────────────────────────────────────────────────
export function Inspector(props) {
    const sim = useSimStore();
    return (<div class="sim-inspector">
      <div class="inspector-header">Inspector</div>

      <div class="inspector-body">
        <Show when={sim.selectedComponentId()} fallback={<Show when={sim.selectedWireId()} fallback={<EmptyState />}>
              {(id) => <WireInspector id={id()} onDelete={props.onDeleteSelected}/>}
            </Show>}>
          {(id) => <ComponentInspector id={id()} onDelete={props.onDeleteSelected} onOpenSketch={props.onOpenSketch}/>}
        </Show>
      </div>
    </div>);
}
//# sourceMappingURL=Inspector.jsx.map