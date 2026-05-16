import { createSignal } from 'solid-js'
import { createStore } from 'zustand/vanilla'
import type { ThemeId, AccentColor } from '@fermion/core'
import { THEME_TIER_ACCESS } from '@fermion/core'
import type { Tier } from '../lib/api'

const LS_THEME = 'fermion-theme'
const LS_ACCENT = 'fermion-accent'

// ── Zustand state + actions ───────────────────────────────────────────────────

interface ThemeState {
  currentTheme: ThemeId
  accentColor: AccentColor
  applyTheme: (id: ThemeId, userTier?: Tier) => void
  setAccent: (color: AccentColor) => void
  canUseTheme: (id: ThemeId, userTier: Tier) => boolean
}

const TIER_ORDER: Tier[] = ['guest', 'free', 'pro', 'ultimate']

function tierMeets(userTier: Tier, required: string): boolean {
  if (required === 'enterprise') return userTier === 'ultimate'
  return TIER_ORDER.indexOf(userTier) >= TIER_ORDER.indexOf(required as Tier)
}

function readSaved(): { theme: ThemeId; accent: AccentColor } {
  const theme = (localStorage.getItem(LS_THEME) as ThemeId | null) ?? 'spatial'
  const accent = (localStorage.getItem(LS_ACCENT) as AccentColor | null) ?? 'blue'
  return { theme, accent }
}

function applyToDOM(theme: ThemeId, accent: AccentColor) {
  document.documentElement.setAttribute('data-theme', theme)
  if (theme === 'spatial') {
    document.documentElement.setAttribute('data-accent', accent)
  } else {
    document.documentElement.removeAttribute('data-accent')
  }
}

const saved = readSaved()

const _store = createStore<ThemeState>()((set, get) => ({
  currentTheme: saved.theme,
  accentColor: saved.accent,

  applyTheme: (id, userTier = 'free') => {
    if (!get().canUseTheme(id, userTier)) return
    const accent = get().accentColor
    applyToDOM(id, accent)
    localStorage.setItem(LS_THEME, id)
    set({ currentTheme: id })
  },

  setAccent: (color) => {
    localStorage.setItem(LS_ACCENT, color)
    const theme = get().currentTheme
    if (theme === 'spatial') {
      document.documentElement.setAttribute('data-accent', color)
    }
    set({ accentColor: color })
  },

  canUseTheme: (id, userTier) => {
    const required = THEME_TIER_ACCESS[id]
    return tierMeets(userTier, required)
  },
}))

// ── SolidJS reactive signals (bridge) ─────────────────────────────────────────

const [currentTheme, setCurrentTheme] = createSignal<ThemeId>(saved.theme)
const [accentColor, setAccentColor] = createSignal<AccentColor>(saved.accent)

_store.subscribe((state) => {
  setCurrentTheme(state.currentTheme)
  setAccentColor(state.accentColor)
})

// Apply saved theme to DOM immediately
applyToDOM(saved.theme, saved.accent)

// ── Public hook ───────────────────────────────────────────────────────────────

const { applyTheme, setAccent, canUseTheme } = _store.getState()

export function useThemeStore() {
  return { currentTheme, accentColor, applyTheme, setAccent, canUseTheme }
}

export function getThemeSnapshot() {
  return _store.getState()
}

export function openThemePalette() {
  window.dispatchEvent(new CustomEvent('fermion:open-theme-palette'))
}
