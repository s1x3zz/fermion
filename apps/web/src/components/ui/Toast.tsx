import { createSignal, For, onCleanup } from 'solid-js'
import { Portal } from 'solid-js/web'

// ── Types ─────────────────────────────────────────────────────────────────────

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface ToastItem {
  id: number
  type: ToastType
  message: string
  duration: number
}

// ── State (module-level singleton) ────────────────────────────────────────────

const [items, setItems] = createSignal<ToastItem[]>([])
let nextId = 0

function addToast(type: ToastType, message: string, duration: number): void {
  const id = ++nextId
  setItems((prev) => [...prev, { id, type, message, duration }])
  setTimeout(() => removeToast(id), duration)
}

function removeToast(id: number): void {
  setItems((prev) => prev.filter((t) => t.id !== id))
}

// ── Public API ────────────────────────────────────────────────────────────────

export const toast = {
  success: (msg: string, duration = 3000) => addToast('success', msg, duration),
  error:   (msg: string, duration = 5000) => addToast('error',   msg, duration),
  warning: (msg: string, duration = 4000) => addToast('warning', msg, duration),
  info:    (msg: string, duration = 3000) => addToast('info',    msg, duration),
}

// ── Toast colours ─────────────────────────────────────────────────────────────

const TOAST_STYLE: Record<ToastType, { border: string; icon: string }> = {
  success: { border: '#22c55e', icon: '✓' },
  error:   { border: '#ef4444', icon: '✕' },
  warning: { border: '#eab308', icon: '⚠' },
  info:    { border: '#3b82f6', icon: 'ℹ' },
}

// ── Container component (mount once in app root) ──────────────────────────────

export function ToastContainer() {
  return (
    <Portal mount={document.body}>
      <div class="toast-container">
        <For each={items()}>
          {(item) => (
            <div
              class="toast-item"
              style={{ 'border-left-color': TOAST_STYLE[item.type].border }}
              onClick={() => removeToast(item.id)}
            >
              <span class="toast-icon" style={{ color: TOAST_STYLE[item.type].border }}>
                {TOAST_STYLE[item.type].icon}
              </span>
              <span class="toast-message">{item.message}</span>
            </div>
          )}
        </For>
      </div>
    </Portal>
  )
}
