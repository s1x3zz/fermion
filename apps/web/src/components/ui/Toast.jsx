import { createSignal, For } from 'solid-js';
import { Portal } from 'solid-js/web';
// ── State (module-level singleton) ────────────────────────────────────────────
const [items, setItems] = createSignal([]);
let nextId = 0;
function addToast(type, message, duration) {
    const id = ++nextId;
    setItems((prev) => [...prev, { id, type, message, duration }]);
    setTimeout(() => removeToast(id), duration);
}
function removeToast(id) {
    setItems((prev) => prev.filter((t) => t.id !== id));
}
// ── Public API ────────────────────────────────────────────────────────────────
export const toast = {
    success: (msg, duration = 3000) => addToast('success', msg, duration),
    error: (msg, duration = 5000) => addToast('error', msg, duration),
    warning: (msg, duration = 4000) => addToast('warning', msg, duration),
    info: (msg, duration = 3000) => addToast('info', msg, duration),
};
// ── Toast colours ─────────────────────────────────────────────────────────────
const TOAST_STYLE = {
    success: { border: '#22c55e', icon: '✓' },
    error: { border: '#ef4444', icon: '✕' },
    warning: { border: '#eab308', icon: '⚠' },
    info: { border: '#3b82f6', icon: 'ℹ' },
};
// ── Container component (mount once in app root) ──────────────────────────────
export function ToastContainer() {
    return (<Portal mount={document.body}>
      <div class="toast-container">
        <For each={items()}>
          {(item) => (<div class="toast-item" style={{ 'border-left-color': TOAST_STYLE[item.type].border }} onClick={() => removeToast(item.id)}>
              <span class="toast-icon" style={{ color: TOAST_STYLE[item.type].border }}>
                {TOAST_STYLE[item.type].icon}
              </span>
              <span class="toast-message">{item.message}</span>
            </div>)}
        </For>
      </div>
    </Portal>);
}
//# sourceMappingURL=Toast.jsx.map