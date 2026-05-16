import { Portal } from 'solid-js/web'
import { onMount, onCleanup, createSignal, Show } from 'solid-js'
import { api } from '../../lib/api'
import { useAuthStore } from '../../stores/authStore'

const TIER_LIMITS = {
  free: { projects: 5, label: 'Free' },
  pro: { projects: 20, label: 'Pro' },
  ultimate: { projects: 'Unlimited', label: 'Ultimate' },
}

export function UpgradeModal(props: { onClose: () => void }) {
  const { tier } = useAuthStore()
  const [loading, setLoading] = createSignal<'pro' | 'ultimate' | null>(null)

  onMount(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') props.onClose()
    }
    document.addEventListener('keydown', onKey)
    onCleanup(() => document.removeEventListener('keydown', onKey))
  })

  async function handleUpgrade(plan: 'pro' | 'ultimate') {
    setLoading(plan)
    try {
      const { url } = await api.createCheckout(plan)
      if (url) window.location.href = url
    } catch (err) {
      console.error('Checkout failed', err)
    } finally {
      setLoading(null)
    }
  }

  return (
    <Portal mount={document.body}>
      <div class="modal-backdrop" onClick={props.onClose}>
        <div
          class="modal-box"
          onClick={(e) => e.stopPropagation()}
          style={{ padding: '28px', 'max-width': '480px', width: '100%' }}
        >
          <h2 style={{ margin: '0 0 8px' }}>Upgrade Your Plan</h2>
          <p style={{ margin: '0 0 20px', color: '#aaa' }}>
            You're currently on the{' '}
            <strong>{TIER_LIMITS[tier() as keyof typeof TIER_LIMITS]?.label ?? 'Free'}</strong> plan.
            Arduino components and sketch compilation require Pro or Ultimate.
          </p>

          <div style={{ display: 'flex', gap: '12px', 'margin-bottom': '20px' }}>
            {/* Pro plan */}
            <div
              style={{
                flex: '1',
                border: '1px solid #333',
                'border-radius': '8px',
                padding: '16px',
                display: 'flex',
                'flex-direction': 'column',
                gap: '8px',
              }}
            >
              <div style={{ 'font-weight': '700', 'font-size': '1.1em' }}>Pro</div>
              <div style={{ color: '#1976d2', 'font-size': '1.4em', 'font-weight': '700' }}>$4.99/mo</div>
              <ul style={{ margin: '0', padding: '0 0 0 18px', color: '#bbb', 'font-size': '0.9em' }}>
                <li>Up to 20 projects</li>
                <li>Arduino simulation</li>
                <li>Sketch compilation</li>
              </ul>
              <button
                class="auth-submit"
                style={{ 'margin-top': 'auto', padding: '8px 16px', background: '#1976d2' }}
                disabled={loading() !== null}
                onClick={() => void handleUpgrade('pro')}
              >
                <Show when={loading() === 'pro'} fallback="Upgrade to Pro">
                  Loading…
                </Show>
              </button>
            </div>

            {/* Ultimate plan */}
            <div
              style={{
                flex: '1',
                border: '1px solid #333',
                'border-radius': '8px',
                padding: '16px',
                display: 'flex',
                'flex-direction': 'column',
                gap: '8px',
              }}
            >
              <div style={{ 'font-weight': '700', 'font-size': '1.1em' }}>Ultimate</div>
              <div style={{ color: '#43a047', 'font-size': '1.4em', 'font-weight': '700' }}>$14.99/mo</div>
              <ul style={{ margin: '0', padding: '0 0 0 18px', color: '#bbb', 'font-size': '0.9em' }}>
                <li>Unlimited projects</li>
                <li>All Pro features</li>
                <li>Priority support</li>
              </ul>
              <button
                class="auth-submit"
                style={{ 'margin-top': 'auto', padding: '8px 16px', background: '#43a047' }}
                disabled={loading() !== null}
                onClick={() => void handleUpgrade('ultimate')}
              >
                <Show when={loading() === 'ultimate'} fallback="Upgrade to Ultimate">
                  Loading…
                </Show>
              </button>
            </div>
          </div>

          <div style={{ 'text-align': 'center' }}>
            <button
              class="auth-submit"
              style={{ width: 'auto', padding: '8px 20px', background: '#333' }}
              onClick={props.onClose}
            >
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    </Portal>
  )
}
