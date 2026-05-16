import { createSignal, Show } from 'solid-js';
import { A } from '@solidjs/router';
import { useAuthStore } from '../../stores/authStore';
import { useProjectStore } from '../../stores/projectStore';
import { useSimStore } from '../../stores/simStore';
import { openThemePalette } from '../../stores/themeStore';
const REFERENCE_RADIUS = 14.4;
export function Toolbar(props) {
    const auth = useAuthStore();
    const project = useProjectStore();
    const sim = useSimStore();
    const [editingName, setEditingName] = createSignal(false);
    let nameInputRef;
    const projectName = () => project.activeProject()?.name ?? 'Untitled project';
    const zoom = () => {
        const r = props.radius();
        if (r <= 0)
            return 100;
        return Math.round((REFERENCE_RADIUS / r) * 100);
    };
    function handleNameKeyDown(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            nameInputRef.blur();
        }
        if (e.key === 'Escape') {
            setEditingName(false);
        }
    }
    async function handleNameBlur() {
        setEditingName(false);
        const active = project.activeProject();
        if (!active)
            return;
        const newName = nameInputRef.value.trim() || 'Untitled project';
        if (newName !== active.name) {
            await project.saveProject({ ...active, name: newName });
        }
    }
    function handleSimulateClick() {
        sim.toggleSimulate();
    }
    function handleReset() {
        if (sim.isSimulating())
            sim.toggleSimulate();
    }
    function handleViewPreset(view) {
        props.controller()?.setView(view);
    }
    const userInitial = () => {
        const email = auth.user()?.email ?? '';
        return email.charAt(0).toUpperCase() || '?';
    };
    const userEmail = () => {
        const email = auth.user()?.email ?? '';
        return email.length > 18 ? email.slice(0, 17) + '…' : email;
    };
    return (<div class="sim-toolbar">
      {/* ── Left ── */}
      <div class="toolbar-section">
        <A href="/dashboard" class="toolbar-logo">
          fer<span>mion</span>
        </A>

        <div class="toolbar-divider"/>

        <div class="toolbar-project-name">
          <input ref={nameInputRef} class="toolbar-name-input" type="text" value={projectName()} size={Math.max(12, projectName().length + 2)} onFocus={() => setEditingName(true)} onBlur={handleNameBlur} onKeyDown={handleNameKeyDown} readOnly={!editingName()}/>
          <Show when={props.isDirty()}>
            <div class="toolbar-dirty-dot" title="Unsaved changes"/>
          </Show>
        </div>
      </div>

      {/* ── Center ── */}
      <div class="toolbar-section toolbar-section-center">
        <button class={`toolbar-btn-simulate${sim.isSimulating() ? ' active' : ''}`} onClick={handleSimulateClick}>
          <Show when={sim.isSimulating()} fallback={<>▶ Simulate</>}>
            <div class="sim-pulse-dot"/>
            Simulating
          </Show>
        </button>

        <button class="toolbar-btn" onClick={handleReset} title="Reset simulation">
          ↺ Reset
        </button>

        <div class="toolbar-divider"/>

        <div class="toolbar-zoom">{zoom()}%</div>

        <button class="toolbar-btn" onClick={() => handleViewPreset('front')}>Front</button>
        <button class="toolbar-btn" onClick={() => handleViewPreset('side')}>Side</button>
        <button class="toolbar-btn" onClick={() => handleViewPreset('top')}>Top</button>
      </div>

      {/* ── Right ── */}
      <div class="toolbar-section toolbar-section-right">
        <button class="toolbar-btn toolbar-btn-save" onClick={props.onSave} title="Save (Ctrl+S)">
          Save
        </button>

        <button class="toolbar-btn" onClick={openThemePalette} title="Change theme (Ctrl+T)">
          ◐
        </button>

        <div class="toolbar-divider"/>

        <Show when={auth.user()} fallback={<A href="/dashboard" class="toolbar-user">
            <div class="toolbar-avatar">G</div>
            <span class="toolbar-user-email">Guest</span>
          </A>}>
          <A href="/dashboard" class="toolbar-user">
            <div class="toolbar-avatar">{userInitial()}</div>
            <span class="toolbar-user-email">{userEmail()}</span>
          </A>
        </Show>
      </div>
    </div>);
}
//# sourceMappingURL=Toolbar.jsx.map