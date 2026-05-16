import { createSignal, createEffect, onCleanup, For, Show } from 'solid-js'
import { Portal } from 'solid-js/web'
import { THEMES, ACCENT_COLORS } from '@fermion/core'
import type { ThemeId, AccentColor } from '@fermion/core'
import { useThemeStore } from '../../stores/themeStore'
import { useAuthStore } from '../../stores/authStore'
import './ThemePalette.css'

interface ThemePaletteProps {
  open: boolean
  onClose: () => void
}

export function ThemePalette(props: ThemePaletteProps) {
  const { currentTheme, accentColor, applyTheme, setAccent, canUseTheme } = useThemeStore()
  const { tier } = useAuthStore()

  const [hovered, setHovered] = createSignal<ThemeId | null>(null)
  const [focused, setFocused] = createSignal(0)

  const previewTheme = () => hovered() ?? currentTheme()

  createEffect(() => {
    const t = hovered()
    if (t) {
      document.documentElement.setAttribute('data-theme', t)
    } else {
      document.documentElement.setAttribute('data-theme', currentTheme())
      if (currentTheme() === 'spatial') {
        document.documentElement.setAttribute('data-accent', accentColor())
      }
    }
  })

  function handleSelect(id: ThemeId) {
    applyTheme(id, tier())
    setHovered(null)
    props.onClose()
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (!props.open) return
    if (e.key === 'Escape') {
      setHovered(null)
      props.onClose()
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setFocused((f) => Math.min(f + 1, THEMES.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setFocused((f) => Math.max(f - 1, 0))
    } else if (e.key === 'Enter') {
      const theme = THEMES[focused()]
      if (theme && canUseTheme(theme.id, tier())) handleSelect(theme.id)
    }
  }

  createEffect(() => {
    if (props.open) {
      window.addEventListener('keydown', handleKeyDown)
    }
    onCleanup(() => window.removeEventListener('keydown', handleKeyDown))
  })

  function handleBackdropClick(e: MouseEvent) {
    if ((e.target as HTMLElement).classList.contains('tp-backdrop')) {
      setHovered(null)
      props.onClose()
    }
  }

  return (
    <Show when={props.open}>
      <Portal>
        <div class="tp-backdrop" onClick={handleBackdropClick}>
          <div class="tp-panel" role="dialog" aria-label="Theme selector">
            <div class="tp-header">
              <span class="tp-title">Choose Theme</span>
              <kbd class="tp-shortcut">Ctrl+T</kbd>
            </div>

            <div class="tp-list">
              <For each={THEMES}>
                {(theme, i) => {
                  const locked = () => !canUseTheme(theme.id, tier())
                  const active = () => currentTheme() === theme.id
                  return (
                    <button
                      class="tp-item"
                      classList={{
                        'tp-item--active': active(),
                        'tp-item--focused': focused() === i(),
                        'tp-item--locked': locked(),
                      }}
                      onClick={() => !locked() && handleSelect(theme.id)}
                      onMouseEnter={() => { setHovered(theme.id); setFocused(i()) }}
                      onMouseLeave={() => setHovered(null)}
                      disabled={locked()}
                      aria-pressed={active()}
                    >
                      <div
                        class="tp-preview-swatch"
                        style={{
                          background: `linear-gradient(135deg, ${theme.previewColors[0]} 40%, ${theme.previewColors[1]} 100%)`,
                        }}
                      >
                        <span
                          class="tp-swatch-dot"
                          style={{ background: theme.previewColors[2] }}
                        />
                      </div>
                      <div class="tp-item-info">
                        <span class="tp-item-name">{theme.name}</span>
                        <span class="tp-item-desc">{theme.description}</span>
                      </div>
                      <Show when={locked()}>
                        <span class="tp-badge">
                          {theme.tier === 'enterprise' ? 'Enterprise' : 'Pro'}
                        </span>
                      </Show>
                      <Show when={active()}>
                        <span class="tp-check">✓</span>
                      </Show>
                    </button>
                  )
                }}
              </For>
            </div>

            <Show when={previewTheme() === 'spatial' || currentTheme() === 'spatial'}>
              <div class="tp-accent-section">
                <span class="tp-accent-label">Accent color</span>
                <div class="tp-accent-swatches">
                  <For each={Object.entries(ACCENT_COLORS) as [AccentColor, { color: string; label: string }][]}>
                    {([key, val]) => (
                      <button
                        class="tp-accent-dot"
                        classList={{ 'tp-accent-dot--active': accentColor() === key }}
                        style={{ background: val.color }}
                        title={val.label}
                        onClick={() => setAccent(key)}
                        aria-label={val.label}
                        aria-pressed={accentColor() === key}
                      />
                    )}
                  </For>
                </div>
              </div>
            </Show>

            <div class="tp-footer">
              <span class="tp-hint">↑↓ navigate · Enter select · Esc close</span>
            </div>
          </div>
        </div>
      </Portal>
    </Show>
  )
}
