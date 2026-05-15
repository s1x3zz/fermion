import { createSignal, For, Show } from 'solid-js';
const LIBRARY = [
    {
        title: 'Power',
        items: [
            { type: 'battery_9v', label: 'Battery (9V)', color: '#8b2f0a' },
            { type: 'voltage_source_dc', label: 'Voltage Source (DC)', color: '#eab308' },
            { type: 'ground', label: 'Ground', color: '#6b7280' },
        ],
    },
    {
        title: 'Passive',
        items: [
            { type: 'resistor', label: 'Resistor', color: '#d4a574' },
            { type: 'capacitor', label: 'Capacitor', color: '#3b82f6' },
            { type: 'inductor', label: 'Inductor', color: '#22c55e' },
            { type: 'potentiometer', label: 'Potentiometer', color: '#92400e' },
        ],
    },
    {
        title: 'Active',
        items: [
            { type: 'led_red', label: 'LED (Red)', color: '#ef4444' },
            { type: 'led_green', label: 'LED (Green)', color: '#22c55e' },
            { type: 'led_blue', label: 'LED (Blue)', color: '#3b82f6' },
            { type: 'led_yellow', label: 'LED (Yellow)', color: '#eab308' },
            { type: 'diode', label: 'Diode', color: '#f97316' },
            { type: 'npn_transistor', label: 'NPN Transistor', color: '#a855f7' },
            { type: 'pnp_transistor', label: 'PNP Transistor', color: '#6366f1' },
        ],
    },
    {
        title: 'ICs',
        items: [
            { type: 'ic_555', label: '555 Timer', color: '#6b7280' },
            { type: 'ic_opamp', label: 'Op-Amp', color: '#14b8a6' },
        ],
    },
    {
        title: 'Microcontrollers',
        items: [
            { type: 'arduino_uno', label: 'Arduino UNO', color: '#00979c', proOnly: true },
            { type: 'arduino_nano', label: 'Arduino Nano', color: '#00979c', proOnly: true },
        ],
    },
];
// ── Section component ─────────────────────────────────────────────────────────
function Section(props) {
    const [open, setOpen] = createSignal(true);
    const visibleItems = () => {
        const q = props.filter.toLowerCase();
        if (!q)
            return props.section.items;
        return props.section.items.filter((i) => i.label.toLowerCase().includes(q));
    };
    return (<Show when={visibleItems().length > 0}>
      <div class="sidebar-section">
        <button class="sidebar-section-header" onClick={() => setOpen((o) => !o)} aria-expanded={open()}>
          <span class="sidebar-section-title">{props.section.title}</span>
          <span class={`sidebar-chevron${open() ? ' open' : ''}`}>›</span>
        </button>

        <Show when={open()}>
          <div class="sidebar-items">
            <For each={visibleItems()}>
              {(item) => {
            const locked = item.proOnly && !props.isPro;
            return (<button class={`comp-item${locked ? ' locked' : ''}`} draggable={!locked} onDragStart={(e) => {
                    if (locked) {
                        e.preventDefault();
                        return;
                    }
                    e.dataTransfer?.setData('fermion/component', item.type);
                }} onClick={() => {
                    if (!locked)
                        props.onPlace(item.type);
                    else if (props.onUpgradePrompt)
                        props.onUpgradePrompt();
                }} title={locked ? 'Upgrade to Pro to use this component' : `Place ${item.label}`}>
                    <div class="comp-icon" style={{ background: locked ? '#1a1a2e' : item.color }}/>
                    <span class="comp-label">{item.label}</span>
                    <Show when={locked}>
                      <span class="comp-lock">🔒</span>
                      <span class="comp-pro-badge">Pro</span>
                    </Show>
                  </button>);
        }}
            </For>
          </div>
        </Show>
      </div>
    </Show>);
}
// ── Sidebar ───────────────────────────────────────────────────────────────────
export function ComponentSidebar(props) {
    const [search, setSearch] = createSignal('');
    const isPro = () => props.userTier() === 'pro' || props.userTier() === 'team';
    function handlePlace(type) {
        // Stub: emit placement event — actual component placement wired up with scene interaction
        console.log('[ComponentSidebar] place:', type);
    }
    return (<div class="sim-sidebar">
      <div class="sidebar-search-wrap">
        <input class="sidebar-search" type="search" placeholder="Search components…" value={search()} onInput={(e) => setSearch(e.currentTarget.value)} spellcheck={false}/>
      </div>

      <div class="sidebar-scroll">
        <For each={LIBRARY}>
          {(section) => (<Section section={section} isPro={isPro()} filter={search()} onPlace={handlePlace} onUpgradePrompt={props.onUpgradePrompt}/>)}
        </For>
      </div>
    </div>);
}
//# sourceMappingURL=ComponentSidebar.jsx.map